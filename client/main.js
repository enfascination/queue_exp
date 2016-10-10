/*jshint esversion: 6 */
/*global amplify */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Helper } from '../imports/lib/helper.js';
import { Sess } from '../imports/lib/quick-session.js';

import '../imports/startup/client/routes.js';
import './templates/experimenter-view.html';
import './templatejs/experimenter-view.js';
import './main.html';

DesignLocal = {};

Tracker.autorun(function() {
    if (TurkServer.inExperiment()) {
        Router.go('/experiment');
    } else if (TurkServer.inExitSurvey()) {
        Router.go('/survey');
    } 
});

Tracker.autorun(function() {
    let group = TurkServer.group();
    if (group === null) return;
    Meteor.subscribe('subjects', group);
});

Tracker.autorun(function() {
    Design.choiceChecked = new ReactiveVar("");
});
Tracker.autorun(function() {
    DesignLocal.choiceCounts = new ReactiveDict();
});
Tracker.autorun(function() {
    Design.pleaseMakeChoice = new ReactiveVar(false);
});
Tracker.autorun(function() {
    Design.userAccount = new ReactiveVar(1.0);
});

Template.experiment.onCreated( function(){
    // make client side subject available
    Sess.setClientSub(Subjects.findOne({meteorUserId: Meteor.userId()}));
});

Template.experiment.helpers({
    testIncomplete: function() {
        return( Design.pleaseMakeChoice.get() );
    },
    showExperimenterView: function() {
        return( Design.experimenterView );
    },
    queueComplete: function() {
        // the last queue is complete when the next shows it's first subject.
        return( Sess.sub().queuePosition === 1 );
    },
});

Template.queueInstructions.helpers({
    counterA: function () {
        return Sess.sub().queueCountA;
    },
    counterB: function () {
        return Sess.sub().queueCountB;
    },
    choiceChecked: function () {
        return Design.choiceChecked.get();
    },
    counterNet: function () {
        return Sess.sub().queuePosition;
    },
    userAccount: function () {
        return Design.userAccount.get();
    },
    earningsAMin: function () {
        let sub = Sess.sub();
        let qPos = sub.queuePosition * Design.positionCosts;
        return( Design.endowment - Design.queueCosts.A + 1.00 - qPos);
    },
    earningsAMax: function () {
        return( Design.endowment - Design.queueCosts.A + 1.00);
    },
    earningsBMin: function () {
        return( Design.endowment - Design.queueCosts.B);
    },
    earningsBMax: function () {
        let sub = Sess.sub();
        let qPos = sub.queuePosition * Design.positionCosts;
        return( Design.endowment - Design.queueCosts.B + 1.00 - qPos);
    },
    groupSize: function () {
        return( Design.maxPlayersInCohort);
    },
    positionCosts: function () {
        return( Design.positionCosts);
    },
});
Template.queueSelections.helpers({
    checkedA: function() {
        //console.log("checkedA");
        let rVal = "";
        if (Design.choiceChecked.get() === "A") {
            rVal = "checked";
        }
        return rVal;
    },
    checkedB: function() {
        //console.log("checkedB");
        let rVal = "";
        if (Design.choiceChecked.get() === "B") {
            rVal = "checked";
        }
        return rVal;
    },
});

Template.queueSelections.events({
	'click button#clickMeA': function (event) {
        //console.log(event.target.id);
        if (Design.choiceChecked.get() === "A") {
            Design.choiceChecked.set("");
            Design.userAccount.set(1.0);
        } 
        else {
            Design.choiceChecked.set("A");
            Design.userAccount.set(0.5);
            Design.pleaseMakeChoice.set( false);
        }
	}, 
	'click button#clickMeB': function (event) {
        //console.log(event.target.id);
        if (Design.choiceChecked.get() === "B") {
            Design.choiceChecked.set("");
        } 
        else {
            Design.choiceChecked.set("B");
            Design.userAccount.set(1.0);
            Design.pleaseMakeChoice.set( false );
        }
	},
});

Template.experimentSubmit.events({
    'click button#exitSurvey': function () {
        if (Design.choiceChecked.get()) {
            Meteor.call('submitQueueChoice', Meteor.userId(), Design.choiceChecked.get());
            Meteor.call('goToExitSurvey');
        }
        else {
            Design.pleaseMakeChoice.set(true);
        }
    }
});

Template.survey.helpers({
    userSelection: function () {
        /// return(Sess.sub().choice);
        // Outside of lobby, Session stops working.  good to know.
        return(Subjects.findOne({meteorUserId: Meteor.userId()}).choice);
    },
});
Template.survey.events({
    'submit .survey': function (e) {
        e.preventDefault();
        let results = {confusing: e.target.confusing.value,
            feedback: e.target.feedback.value};
        TurkServer.submitExitSurvey(results);
    }
});
