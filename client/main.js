/*jshint esversion: 6 */

import '../imports/startup/client/routes.js';
import { Helper } from '../imports/lib/helper.js';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';

import './main.html';

Design = {}

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
    Meteor.subscribe('queues', group);
    Meteor.subscribe('queueVotes', group);
    Meteor.subscribe('subjects', group);
});

Tracker.autorun(function() {
    Design.choiceChecked = new ReactiveVar("");
});
Tracker.autorun(function() {
    Design.pleaseMakeChoice = new ReactiveVar(false);
});
Tracker.autorun(function() {
    Design.userAccount = new ReactiveVar(1.0);
});

Template.experiment.helpers({
    testIncomplete: function() {
        return( Design.pleaseMakeChoice.get() );
    },
});

Template.queueInstructions.helpers({
    counterA: function () {
        let clickObjA = Queues.findOne({queueID: "A"});
        return clickObjA && clickObjA.count;
    },
    counterB: function () {
        let clickObjB = Queues.findOne({queueID: "B"});
        return clickObjB && clickObjB.count;
    },
    choiceChecked: function () {
        return Design.choiceChecked.get();
    },
    counterNet: function () {
        return( "XXX" );
    },
    userAccount: function () {
        return Design.userAccount.get();
    },
    earningsA: function () {
        return( "XXX" );
    },
    earningsBMin: function () {
        return( "XXX" );
    },
    earningsBMax: function () {
        return( "XXX" );
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
            Meteor.call('submitQueueChoice', Design.choiceChecked.get());
            Meteor.call('goToExitSurvey');
        }
        else {
            Design.pleaseMakeChoice.set(true);
        }
    }
});

Template.survey.helpers({
    userSelection: function () {
        let userObj = QueueVotes.findOne({userID: Meteor.userId()}, {}, Helper.err_func);
        return(userObj.queuePicked);
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
