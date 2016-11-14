/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Questions } from '../../imports/startup/experiment_prep.js';

Template.survey.helpers({
	questions: function(){
        return Questions.find({sec: 'survey'}).fetch() ;
    },
    testProceed: Helper.testProceed,
});
Template.survey.events({
    'submit form#submitSurvey': function (e) {
        e.preventDefault();

        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        // AHHHHHHHH
        Meteor.call( "setReadyToProceed", Meteor.userId() );
        return;
        // AHHHHHHHH
        let qs = Questions.find({sec: 'survey'}).forEach( function( q ) {
            let element_raw = $(e.target).children("div#"+q._id)[0];
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            Questions.update({_id: q._id}, {$set: { answered: answered, choice : choice }});
        });
        /////////////////////
        //// IF INPUTS OK, SUBMIT ANSWERS AND ....
        /////////////////////
        qs = Questions.find({sec: 'survey'}).forEach( function( q ) {
            Meteor.call("initializeSurveyData", Meteor.userId(), Questions.findOne({_id: q._id}), function(err,data) {
                if (err) { throw( err ); }
                //console.log("initSurvey cb", answered, choice, data);
            } );
        });
        /////////////////////
        //// ... SEPARATELY, ADVANCE STATE 
        /////////////////////
        // uncheck buttons in UI
        //Helper.buttonsReset( e.currentTarget );
        Helper.buttonsDisable( e.currentTarget );

        //console.log("form#submitSurvey");
        Meteor.call( "setReadyToProceed", Meteor.userId() );
    },
    'click button#exitSurvey': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });
        if ( sub.readyToProceed ) {
            Meteor.call("advanceSubjectSection", muid, "submitHIT");
        }
    },
});

Template.submitHIT.helpers({
    "testQuizPassed": function() {
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId: muid } );
        if (muid && sub ) {
            return( sub.quiz.passed );
        }
	},
});
Template.submitHIT.events({
    'submit form.submitHIT': function (e) {
        console.log("IN HERE");
        let results = null;
        e.preventDefault();
        results = { feedback: e.target.feedback.value };
        TurkServer.submitExitSurvey(results);
    },
});

