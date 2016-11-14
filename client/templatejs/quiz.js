/*jshint esversion: 6 */

var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep.js';

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

Template.quiz.events({
    'submit form#submitQuiz': function(e) {
        e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        //Only allow clients to attempt quiz twice before preventing them from doing so
        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        // AHHHHHHHH
        Meteor.call( "setReadyToProceed", Meteor.userId() );
        return;
        // AHHHHHHHH
        let qs = Questions.find({sec: 'quiz'}).forEach( function( q ) {
            let form = e.target;
            //let answer = $.trim(form[q._id].value.toLowerCase());
            //let correct = $.inArray(answer,q.answer) >= 0 ? true: false;
            let element_raw = $(form).children("div#"+q._id)[0];
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            let correct = answered && ( choice === q.answer[0] );
            Questions.update({_id: q._id}, {$set: {correct: correct, answered: answered, choice : choice }});
            if (!correct) {
                Helper.questionHasError( element_raw, true );
                console.log("Quiz Failure", q._id, answered, choice, correct, element_raw);
            } else {
                Helper.questionHasError( element_raw, false );
            }
        });
        let resultsCount = Questions.find({sec: 'quiz', correct:true}).count();
        let answeredCount = Questions.find({sec: 'quiz', answered:true}).count();
        let questionsCount = Questions.find({sec: 'quiz'}).count();
        //console.log("counts", questionsCount, answeredCount, resultsCount);
        //if ( answeredCount === questionsCount ) {
        if ( true ) {
            UserElements.quizSubmitted.set( true );
            let passed = false;
            if ( resultsCount === questionsCount ) {
                passed = true;
            }
            let sub = SubjectsStatus.findOne({ meteorUserId: muid });
            let failed = false; // this is not the opposite of passing
            let triesLeft = sub.quiz.triesLeft;
            if ( !passed || sub.quiz.failed) {// have I alrady failed this person?
                triesLeft = sub.quiz.triesLeft - 1;
                if ( triesLeft === 0 || triesLeft < 0 ) {
                    failed = true;
                }
            }
            /////////////////////
            //// IF INPUTS OK, SUBMIT ANSWERS AND ....
            /////////////////////
            let quizObj = {"passed" : passed, "failed" : failed, "triesLeft" : triesLeft};
            Meteor.call('updateQuiz', muid, quizObj );
            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
            if ( passed || failed ) {
                Meteor.call( "setReadyToProceed", muid );
                Helper.buttonsDisable( e.currentTarget );
                if ( failed ) {
                    Helper.buttonsReset( e.currentTarget );
                }
            }
        } else {
        }
    },
    'click button#exitQuiz': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });
        if ( sub.readyToProceed ) {
            let nextSection = "experiment";
            if (sub.quiz.failed) {
                nextSection = "submitHIT";
            }
            Meteor.call("advanceSubjectSection", muid, nextSection);
        }
    },
});

Template.proceedButton.events({
});

// multi-template helpers
const quizTriesLeft = function quizTriesLeft() {
    return( UserElements.quizTriesLeft.get() );
};

Template.quiz.helpers({
	questions: function(){
        return Questions.find({sec: 'quiz'}).fetch() ;
	},
    //testQuizSubmitted: function() {
        //return( UserElements.quizSubmitted.get() );
    //},
    testQuizPassed: function() {
        //console.log("testQuizPassed", UserElements.quizSubmitted.get(), Sess.subStat().quiz.passed);
        if( !_.isNil( Sess.subStat() ) ) {
            return( Sess.subStat().quiz.passed );
        }
    },
    testQuizWrong: function() {
        //console.log("testQuizWrong", UserElements.quizSubmitted.get(), !Sess.subStat().quiz.passed);
        if (UserElements.quizSubmitted.get()) {
            return( !Sess.subStat().quiz.passed );
        }
    },
    testQuizFailed: function() {
        //console.log("testQuizFailed", UserElements.quizSubmitted.get(), Sess.subStat().quiz.failed);
        if( !_.isNil( Sess.subStat() ) ) {
            return( Sess.subStat().quiz.failed );
        }
    },
    testProceed: function() {
            //console.log("testProceed",  Sess.subStat(), Sess.subStat().quiz.passed , Sess.subStat().quiz.failed);
        if( !_.isNil( Sess.subStat() ) ) {
            return( Sess.subStat().readyToProceed );
        }
    },
    quizTriesLeft: quizTriesLeft,
});
Template.questionBinary.events({
	'click div.expQuestion': function (e) {
        e.stopPropagation();
        if ( e.target.hasAttribute( "checked" ) ) {
            e.currentTarget.setAttribute( "choice", e.target.getAttribute("choice") );
        } else {
            e.currentTarget.removeAttribute( "choice" );
        }
    },
});

