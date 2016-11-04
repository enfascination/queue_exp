/*jshint esversion: 6 */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

Template.survey.helpers({
    userSelection: function () {
        let muid = Meteor.userId();
        let sd = SubjectsData.findOne({ meteorUserId: Meteor.userId() } );
        if (muid && sd ) {
            return( sd.choice );
        }
    },
    "testQuizPassed": function() {
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId: Meteor.userId() } );
        if (muid && sub ) {
            return( sub.quiz.passed );
        }
},
});
Template.survey.events({
    'submit .survey': function (e) {
        let results = null;
        e.preventDefault();
        results = { feedback: e.target.feedback.value };
        TurkServer.submitExitSurvey(results);
    }
});

