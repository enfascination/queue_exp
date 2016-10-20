/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Helper } from '../imports/lib/helper.js';
import { Sess } from '../imports/lib/quick-session.js';
import 'bootstrap-sass';


import '../imports/startup/client/routes.js';
import './templates/experimenter-view.html';
import './templatejs/experimenter-view.js';
import './main.html';

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
    Meteor.subscribe('designs', group);
});

Tracker.autorun(function() {
    UserElements.choiceChecked = new ReactiveVar("");
    UserElements.pleaseMakeChoice = new ReactiveVar(false);
    UserElements.userAccount = new ReactiveVar();
});

Template.experiment.onCreated( function(){
    // make client side subject available
    sub = Subjects.findOne({meteorUserId: Meteor.userId()});
    if (sub) {
        Sess.setClientSub( sub );
        Sess.setClientDesign(CohortSettings.findOne({ cohortId: sub.cohortId }));
    }
});

Template.experiment.helpers({
    testIncomplete: function() {
        return( UserElements.pleaseMakeChoice.get() );
    },
    showExperimenterView: function() {
        return( UserElements.experimenterView || TurkServer.isAdmin() );
    },
});

Template.queueInstructions.onCreated( function(){
});
Template.queueInstructions.helpers({
    counterA: function () {
        return Sess.sub().queueCountA;
    },
    counterB: function () {
        return Sess.sub().queueCountB;
    },
    choiceChecked: function () {
        return UserElements.choiceChecked.get();
    },
    counterNet: function () {
        return Sess.sub().queuePosition;
    },
    userAccount: function () {
        if (!UserElements.userAccount.get()) {
            let des = Sess.design();
            UserElements.userAccount.set(des.endowment);
        }
        return( Helper.toCash( UserElements.userAccount.get() ) );
    },
    earningsAMin: function () {
        let sub = Sess.sub();
        let aDesign = Sess.design();
        let qPos = sub.queuePosition * aDesign.positionCosts;
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 - qPos ) );
    },
    earningsAMax: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 ) );
    },
    earningsBMin: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B ) );
    },
    earningsBMax: function () {
        let sub = Sess.sub();
        let aDesign = Sess.design();
        let qPos = sub.queuePosition * aDesign.positionCosts;
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B + 1.00 - qPos ) );
    },
    groupSize: function () {
        let aDesign = Sess.design();
        return( aDesign.maxPlayersInCohort);
    },
    positionCosts: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.positionCosts ) );
    },
    endowment: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.endowment ) );
    },
    pot: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.pot ) );
    },
});
Template.queueSelections.helpers({
    checkedA: function() {
        //console.log("checkedA");
        let rVal = "";
        if (UserElements.choiceChecked.get() === "A") {
            rVal = "checked";
        }
        return rVal;
    },
    checkedB: function() {
        //console.log("checkedB");
        let rVal = "";
        if (UserElements.choiceChecked.get() === "B") {
            rVal = "checked";
        }
        return rVal;
    },
});

Template.queueSelections.events({
	'click button#clickMeA': function (event) {
        //console.log(event.target.id);
        let des = Sess.design();
        if (UserElements.choiceChecked.get() === "A") {
            UserElements.choiceChecked.set("");
            UserElements.userAccount.set(des.endowment);
        } 
        else {
            UserElements.choiceChecked.set("A");
            UserElements.userAccount.set(des.endowment - des.queueCosts.A);
            UserElements.pleaseMakeChoice.set( false);
        }
	}, 
	'click button#clickMeB': function (event) {
        //console.log(event.target.id);
        let des = Sess.design();
        if (UserElements.choiceChecked.get() === "B") {
            UserElements.choiceChecked.set("");
            UserElements.userAccount.set(des.endowment);
        } 
        else {
            UserElements.choiceChecked.set("B");
            UserElements.userAccount.set(des.endowment - des.queueCosts.B);
            UserElements.pleaseMakeChoice.set( false );
        }
	},
});

Template.experimentSubmit.events({
    'click button#exitSurvey': function () {
        if (UserElements.choiceChecked.get()) {
            Meteor.call('submitQueueChoice', Meteor.userId(), UserElements.choiceChecked.get());
            //if end of queue, calculate all earnings
            let cohortId = Sess.sub().cohortId;
            let design = Sess.design();
            let cohort = Subjects.find({
                cohortId : cohortId, 
                choice: { $ne: 'X' } 
            });
            // plus one because the current player is an X
            // greater-than because life can be crazy
            if ( cohort.fetch().length + 1 >= design.maxPlayersInCohort ) {
                Meteor.call( 'calculateQueueEarnings', cohortId, design );
            }
            Meteor.call('goToExitSurvey');
        }
        else {
            UserElements.pleaseMakeChoice.set(true);
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
