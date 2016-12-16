/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep_instpref.js';
import { Schemas } from '../../api/design/schemas.js';

Template.survey.helpers({
});
Template.answersForm.events({
    'submit form.answersForm#survey': function (e) {
        e.preventDefault();

        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        // AHHHHHHHH
        //Meteor.call( "setReadyToProceed", Meteor.userId() );
        //return;
        // AHHHHHHHH
        let qs = Questions.find({sec: 'survey'}).forEach( function( q ) {
            let element_raw = $(e.target).find(".expQuestion#"+q._id)[0];
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            Questions.update({_id: q._id}, {$set: { answered: answered, choice : choice }});
        });
        /////////////////////
        //// IF INPUTS OK, SUBMIT ANSWERS AND ....
        /////////////////////
        qs = Questions.find({sec: 'survey'}).forEach( function( q ) {
            let theData = {
                questionType: q.type,
                question: q.text,
                answer: q.choice,
                answered: q.answered,
            };
            try {
                check(theData, Schemas.SurveyAnswers);
            } catch (err) {
                console.log("Data failed validation");
                throw(err);
            }
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
});

Template.main.events({
    'click button.proceedButton#survey': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button#proceedButton#experiment survey", sub);
        if ( sub.readyToProceed ) {
            Meteor.call("advanceSubjectSection", muid, "submitHIT", "submitHIT");
        }
    },
});

Template.submitHIT.helpers({
    "testQuizPassed": function() {
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        if (muid && sub ) {
            return( sub.quiz.passed );
        }
	},
});
Template.submitHIT.events({
    //'submit form.submitHIT': function (e) {
    'submit form.answersForm#submitHIT': function (e) {
        e.preventDefault();
        let theData = { feedback: e.target.feedback.value };
        try {
            check(theData, Schemas.ExitSurveyAnswers);
        } catch (err) {
            console.log("Data failed validation");
            throw(err);
        }
        TurkServer.submitExitSurvey(theData);
    },
});

