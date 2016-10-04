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
    counter: function () {
        var clickObj = Queues.findOne({queueID: 'A'});
        return clickObj && clickObj.count;
    }
});

Template.design.events({
    'click button#clickMe': function () {
        Meteor.call('incClicks');
    }
});

Template.design.events({
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
