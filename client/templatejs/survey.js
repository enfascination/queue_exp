/*jshint esversion: 6 */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Questions } from '../../imports/startup/experiment.js';

Template.survey.helpers({
    userSelection: function () {
        let muid = Meteor.userId();
        let sd = SubjectsData.findOne({ meteorUserId: muid } );
        if (muid && sd ) {
            return( sd.choice );
        }
    },
    "testQuizPassed": function() {
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId: muid } );
        if (muid && sub ) {
            return( sub.quiz.passed );
        }
	},
	questions: function(){
        return Questions.find({section: 'survey'}).fetch() ;
    },
    testProceed: Helper.testProceed,
});
Template.survey.events({
    'submit form#submitSurvey': function (e) {
        e.preventDefault();

        // uncheck buttons in UI
        //Helper.buttonsReset( e.currentTarget );
        Helper.buttonsDisable( e.currentTarget );

        //console.log("form#submitSurvey");
        Meteor.call( "setReadyToProceed", Meteor.userId() );
    },
});

Template.exitSurvey.events({
    'submit form.exitSurvey': function (e) {
        let results = null;
        e.preventDefault();
        results = { feedback: e.target.feedback.value };
        TurkServer.submitExitSurvey(results);
    },
});

