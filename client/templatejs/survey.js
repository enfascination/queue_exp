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
        let qs = Template.currentData().questionsColl ? Template.currentData().questionsColl.fetch() : [];
        //let qs = Questions.find({ meteorUserId : sub.meteorUserId, sec: 'survey'}).fetch();
        qs.forEach( function( q ) {
            let element_raw = $(e.target).find(".expQuestion#"+q._id)[0];
            let element = $( element_raw );
            let choice;
            if (q.type === 'dropdown' || q.type === 'checkbox') {
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
                //console.log(q.label, q.pattern, (new RegExp(q.pattern)), (new RegExp(q.pattern)).test( choice ));
            }

            // require all answers
            // data validation for better check of answered
            let theData = {
                type: q.type,
                label: q.label,
                choice: choice,
                answered: answered,
                hasError : hasError,
            };
            _.assign(q, theData); // client side update: assign is a mutator of q
            if (!answered || !Match.test(q, Schemas.SurveyAnswers) ) {
                console.log("Survey fail", q, Schemas.SurveyAnswers);
                Schemas.SurveyAnswers.validate( q );
                theData.hasError = true;
                UserElements.questionsIncomplete.set(true);
            } else {
                answeredCount += 1;
            }
            Meteor.call("updateSubjectQuestion", sub.meteorUserId, q._id, theData ); //optional?
            //console.log("grading survey", q);
        });
        /////////////////////
        //// IF INPUTS OK, SUBMIT ANSWERS AND ....
        /////////////////////
        //console.log(answeredCount ,qs.length, sub.sec_rnd_now, Questions.findOne({sec: this.currentSection.id}));
        if ( Debugging || answeredCount === qs.length ) {
        //if ( answeredCount === qs.length ) {
            qs.forEach( function( q ) {
                Meteor.call("insertQuestionToSubData", Meteor.userId(), q );
            });

            /// calculate payoffs
            Meteor.call("updateExperimentEarnings", Meteor.userId(), Sess.design() );

            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
            // uncheck buttons in UI
            //Helper.buttonsReset( e.currentTarget );
            UserElements.questionsIncomplete.set(false);
            Meteor.call( "disableQuestions", qs.map( (q) => q._id ), reset=false );

            //console.log("form#submitSurvey");
            Meteor.call( "setReadyToProceed", Meteor.userId(), function(err) {
                    Helper.windowAdjust(sub, bottom=true );
                } );
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
            Meteor.call("advanceSubjectSection", muid, "earningsReport", "experiment");
            Helper.windowAdjust(sub );
        }
    },
});
Template.main.events({
    'click button.proceedButton#earningsReport': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button.proceedButton#earningsReport", sub);
        if ( sub.readyToProceed ) {
            Meteor.call("advanceSubjectSection", muid, "submitHIT", "submitHIT");
            Helper.windowAdjust(sub );
        }
    },
});

Template.submitHIT.helpers({
    "testQuizPassed": function() {
        let sub = Sess.subStat();
        let design = Sess.design();
        return( sub && (  sub.quiz.passed || ( sub.isExperienced > 0 && sub.isExperienced < design.maxExperimentReps ) ) );
	},
    "lastRepeat" : function() {
        let sub = Sess.subStat();
        let design = Sess.design();
        return( sub && ( (sub.isExperienced + 1) === design.maxExperimentReps ) );
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

