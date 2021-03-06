/*jshint esversion: 6 */

var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Router } from 'meteor/iron:router';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Schemas } from '../../api/design/schemas.js';

// controller
Template.quiz.onCreated( function(){
    // interaction elements
    UserElements.quizIncomplete = new ReactiveVar(false);

    let muid = Meteor.userId();
    let instance = this;
    let subscription = instance.subscribe('s_status');
    UserElements.quizSubmitted = new ReactiveVar( false );
    UserElements.quizTriesLeft = new ReactiveVar( Design.maxQuizFails );
    instance.autorun(function () {
        if (subscription.ready()) {
            //console.log("onCreated",  Sess.quizTriesLeft( muid ) , Design.maxQuizFails );
            UserElements.quizSubmitted.set( Sess.quizTriesLeft( muid ) != Design.maxQuizFails );
            UserElements.quizTriesLeft.set( Sess.quizTriesLeft( muid ) );
        }
    });
});
Template.introSectionTabPane.helpers({
    testTest : function() {
        console.log( "introSectionTabPane", Template.instance(), Template.currentData(), 'lllll' );
    },
});

Template.answersForm.events({
    'submit form.answersForm#quiz': function(e) {
        e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        let sub = Sess.subStat();

        //console.log("quiz event submit", Sess.design(), Sess.subStat(), Template.currentData() );
        // if state is still in instructions, change that


        //Only allow clients to attempt quiz twice before preventing them from doing so
        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        // AHHHHHHHH
        //Meteor.call( "setReadyToProceed", Meteor.userId() );
        //return;
        // AHHHHHHHH
        let answeredCount = 0;
        let resultsCount = 0;
        let form = e.target;
        //let qs = Questions.find({ meteorUserId : sub.meteorUserId, sec: 'quiz'});
        let qs = Template.currentData().questionsColl ? Template.currentData().questionsColl.fetch() : [];
        qs.forEach( function( q ) {
            //let answer = $.trim(form[q._id].value.toLowerCase());
            //let correct = $.inArray(answer,q.correctAnswer) >= 0 ? true: false;
            let element_raw = $(form).find(".expQuestion#"+q._id)[0];
            //console.log("qs", element_raw, q, q._id);
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            let correct = ( choice === q.correctAnswer[0] );
            let hasError = false;
            // double check correctness before udpating
            let theData = {correct: correct, answered: answered, choice : choice, hasError : hasError };
            _.assign(q, theData); // client side update: assign is a mutator of q
            if ( !answered || !correct || !Match.test(q, Schemas.QuizAnswers) ) {
                theData.correct = false;
                theData.hasError = true;
                Schemas.QuizAnswers.validate( q );
                console.log("Quiz Failure", answered, correct, Match.test(theData, Schemas.QuizAnswers));
            } else {
                answeredCount += 1;
                resultsCount += correct ? 1 : 0;
            }
            Meteor.call("updateSubjectQuestion", sub.meteorUserId, q._id, theData );
        });
        //console.log("counts", qs.length, answeredCount, resultsCount, qs.map( (q) => q._id ));
        //if ( answeredCount === qs.length ) {
        if ( true ) {
            let passed = false;
            if ( resultsCount === qs.length ) {
                passed = true;
            }
            //let sub = Sess.subStat();
            let failed = false; // this is not the opposite of passing
            let triesLeft = sub.quiz.triesLeft;
            if ( !passed || sub.quiz.failed) {// have I alrady failed this person?
                triesLeft = sub.quiz.triesLeft - 1;
                if ( triesLeft === 0 || triesLeft < 0 ) {
                    failed = true;
                    Helper.disableTab( "instructions" );
                }
            }
            /////////////////////
            //// IF INPUTS OK, SUBMIT ANSWERS AND ....
            /////////////////////
            let quizObj = {"passed" : passed, "failed" : failed, "triesLeft" : triesLeft};
            Meteor.call('updateQuiz', muid, quizObj );

            // caluclate earnings (in case there is an earnings change after quiz, like recieivng the endowment
            Meteor.call("updateExperimentEarnings", muid, Sess.design());


            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
            if ( Debugging || passed || failed ) {
                Meteor.call( "disableQuestions", qs.map( (q) => q._id ), reset=failed ? true : false );
                if ( failed ) {
                    Helper.buttonsReset( e.currentTarget );
                }

                Meteor.call( "setReadyToProceed", muid, function(err) {
                    Helper.windowAdjust(sub, bottom=true );
                } );
            }

            // don't be too snappy with the visual update
            UserElements.quizSubmitted.set( true );
        } else {
        }
    },
});
Template.main.events({
    'click button.proceedButton#quiz': function ( e ) {
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button#proceedButton#quiz", sub);
        if ( sub && sub.readyToProceed ) {
            if (sub.quiz.failed) {
                Meteor.call("advanceSubjectSection", muid, "submitHIT", "submitHIT");
            } else {
                Meteor.call("advanceSubjectSection", muid, "experiment1", "experiment", asyncCallback=function(err, updatedSub) {
                    if (err) { throw( err ); }
                    Meteor.call('initializeSection', sub=updatedSub, lastDesign=Sess.design());
                });
            }
            // Meteor.call('goToExitSurvey', Meteor.userId()); redundant

        //console.log("button#proceedButton#quiz", "scrolling to top");
        }
        //Helper.windowAdjust(sub, bottom=false );
        //window.scrollTo(0, 0);
    },
});

Template.proceedButton.events({
});

// multi-template helpers
const quizTriesLeft = function quizTriesLeft() {
    return( UserElements.quizTriesLeft.get() );
};

Template.answersForm.helpers({
    //testQuizSubmitted: function() {
        //return( UserElements.quizSubmitted.get() );
    //},
    testQuizPassed: function() {
        //console.log("testQuizPassed", UserElements.quizSubmitted.get(), Sess.subStat().quiz.passed);
        let sub = Sess.subStat();
        if( sub && !_.isNil( sub ) ) {
            return( sub.quiz.passed );
        }
    },
    testQuizWrong: function() {
        //console.log("testQuizWrong", UserElements.quizSubmitted.get(), !Sess.subStat().quiz.passed);
        let sub = Sess.subStat();
        if (sub && sub.quiz && UserElements.quizSubmitted.get()) {
            return( !sub.quiz.passed );
        }
    },
    testQuizFailed: function() {
        //console.log("testQuizFailed", UserElements.quizSubmitted.get(), Sess.subStat().quiz.failed);
        let sub = Sess.subStat();
        if( sub && !_.isNil( sub ) ) {
            return( sub.quiz.failed );
        }
    },
    quizTriesLeft: quizTriesLeft,
});

let questionFloatToExpQuestion = function (e) {
        e.stopPropagation();
        let oe = $(e.target);
        if ( oe.hasClass( "btn" ) ) {
            if ( e.target.hasAttribute( "checked" ) ) {
                e.currentTarget.setAttribute( "choice", oe.attr("choice") );
            } else {
                e.currentTarget.removeAttribute( "choice" );
            }
        }
    };
Template.questionBinary.events({
	'click div.expQuestion': questionFloatToExpQuestion,
});
Template.questionQuad.events({
	'click div.expQuestion': questionFloatToExpQuestion,
});

