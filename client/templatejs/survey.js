/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
//import { Questions } from '../../imports/startup/experiment_prep_instpref.js';
import { Schemas } from '../../api/design/schemas.js';

Template.survey.helpers({
});
Template.answersForm.events({
    'submit form.answersForm#survey': function (e) {
        e.stopPropagation();
        e.preventDefault();

        let sub = Sess.subStat();
        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        // AHHHHHHHH
        //Meteor.call( "setReadyToProceed", Meteor.userId() );
        //return;
        // AHHHHHHHH
        let answeredCount = 0;
        let questionsCount = 0;
        let qs = Template.currentData().questionsColl.fetch();
        //let qs = Questions.find({ meteorUserId : sub.meteorUserId, sec: 'survey'}).fetch();
        qs.forEach( function( q ) {
            let element_raw = $(e.target).find(".expQuestion#"+q._id)[0];
            let element = $( element_raw );
            let choice;
            if (q.type === 'dropdown') {
                // http://stackoverflow.com/questions/1085801/get-selected-value-in-dropdown-list-using-javascript#1085810
                choice = element.find("select option:selected:not([hidden])").val();
            } else if (q.type === 'text') {
                choice = element.find("input").val();
            } else {
                choice = element.attr("choice");
            }
            let answered = !_.isNil( choice );
            let hasError = false;

            // custom restricted text test
            if (q.type==='text' && q.pattern && !(new RegExp(q.pattern)).test( choice )) { 
                answered=false;
                console.log(q.text, q.pattern, (new RegExp(q.pattern)), (new RegExp(q.pattern)).test( choice ));
            }

            // require all answers
            // data validation for better check of answered
            let theData = {
                questionType: q.type,
                question: q.text,
                choice: choice,
                answered: answered,
                hasError : hasError,
            };
            if (!answered || !Match.test(theData, Schemas.SurveyAnswers) ) {
                theData.hasError = true;
                UserElements.questionsIncomplete.set(true);
            } else {
                answeredCount += 1;
            }
            questionsCount += 1;
            _.assign(q, theData); // client side update: assign is a mutator of q
            Meteor.call("updateSubjectQuestion", sub.meteorUserId, q._id, theData ); //optional?
        });
        /////////////////////
        //// IF INPUTS OK, SUBMIT ANSWERS AND ....
        /////////////////////
        //console.log(choices,answeredCount ,questionsCount, sub.sec_rnd_now, Questions.findOne({sec: this.currentSection.id}));
        if ( answeredCount === questionsCount ) {
            qs.forEach( function( q ) {
                Meteor.call("insertSurveyQuestion", Meteor.userId(), q );
            });
            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
            // uncheck buttons in UI
            //Helper.buttonsReset( e.currentTarget );
            UserElements.questionsIncomplete.set(false);
            Meteor.call( "disableQuestions", _.map(qs, "_id"), reset=false );

            //console.log("form#submitSurvey");
            Meteor.call( "setReadyToProceed", Meteor.userId() );
        }
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

