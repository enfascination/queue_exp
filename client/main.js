/*jshint esversion: 6 */

import '../imports/startup/client/routes.js';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';

import './main.html';

Tracker.autorun(function() {
    if (TurkServer.inExperiment()) {
        Router.go('/experiment');
    } else if (TurkServer.inExitSurvey()) {
        Router.go('/survey');
    } 
});

Tracker.autorun(function() {
    var group = TurkServer.group();
    if (group === null) return;
    Meteor.subscribe('clicks', group);
});

Template.design.helpers({
    counterA: function () {
        var clickObjA = Queues.findOne({queueID: "A"});
        return clickObjA && clickObjA.count;
    },
    counterB: function () {
        var clickObjB = Queues.findOne({queueID: "B"});
        return clickObjB && clickObjB.count;
    },
});

Template.design.events({
	'click button#clickMeA': function (event) {
        console.log(event.target.id);
	    Meteor.call('incClicksA', event.target.id);
        if (choiceChecked.get() === "A") {
            choiceChecked.set("");
        } 
        else {
            choiceChecked.set("A");
        }
	}, 
	'click button#clickMeB': function (event) {
        console.log(event.target.id);
	    Meteor.call('incClicksB', event.target.id);
        if (choiceChecked.get() === "B") {
            choiceChecked.set("");
        } 
        else {
            choiceChecked.set("B");
        }
	},
    'click button#exitSurvey': function () {
        Meteor.call('goToExitSurvey');
    }
});

Template.survey.events({
    'submit .survey': function (e) {
        e.preventDefault();
        var results = {confusing: e.target.confusing.value,
            feedback: e.target.feedback.value};
        TurkServer.submitExitSurvey(results);
    }
});
