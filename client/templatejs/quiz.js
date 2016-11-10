/*jshint esversion: 6 */

var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../api/experiment.js';

// controller
Template.quiz.onCreated( function(){
    // interaction elements
    UserElements.pleaseMakeChoice = new ReactiveVar(false);
    UserElements.choiceChecked = new ReactiveDict(); // this is so there can be mulplie of these buttons on a page
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
    'submit form#submitQuiz': function(event){
        event.stopPropagation();
        event.preventDefault();
        let muid = Meteor.userId();
        //Only allow clients to attempt quiz twice before preventing them from doing so
        qs = Questions.find({section: 'quiz'}).forEach( function( q ) {
            let form = event.target;
            //let answer = $.trim(form[q._id].value.toLowerCase());
            //let correct = $.inArray(answer,q.answer) >= 0 ? true: false;
            let element = $( $(form).children("div#"+q._id)[0] );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            let correct = answered && ( choice === q.answer[0] );
            console.log(q._id, answered, choice, correct);
            Questions.update({_id: q._id}, {$set: {correct: correct, answered: answered, choice : choice }});
            // mark incorrect in DOM
            if (correct) {
                element.removeClass( "has-error" );
            } else { 
                element.addClass( "has-error" );
            }
        });
        let resultsCount = Questions.find({section: 'quiz', correct:true}).count();
        let answeredCount = Questions.find({section: 'quiz', answered:true}).count();
        let questionsCount = Questions.find({section: 'quiz'}).count();
        console.log("counts", questionsCount, answeredCount, resultsCount);
        //if ( answeredCount === questionsCount ) {
        if ( true ) {
            UserElements.quizSubmitted.set( true );
            let passed, failed;
            let triesLeft = UserElements.quizTriesLeft.get();
            if ( resultsCount === questionsCount ) {
                //console.log("passed");
                failed = false;
                passed = true;
            } else{
                //console.log("failing");
                if (triesLeft === 0) {
                    failed = true;
                }
                passed = false;
                triesLeft = triesLeft - 1;
            }
            UserElements.pleaseMakeChoice.set( false );
            Meteor.call('updateQuiz', muid, passed);
        } else {
        }
    },
    'click button#exitQuiz': function ( e ) {
        event.stopPropagation();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });
        if ( sub.readyToProceed ) {
            UserElements.pleaseMakeChoice.set( false );
            Meteor.call("advanceSubjectSection", muid);
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
        return Questions.find({section: 'quiz'}).fetch() ;
	},
    //testQuizSubmitted: function() {
        //return( UserElements.quizSubmitted.get() );
    //},
    testQuizPassed: function() {
        //console.log("testQuizPassed", UserElements.quizSubmitted.get(), Sess.subStat().quiz.passed);
        return( Sess.subStat().quiz.passed );
    },
    testQuizWrong: function() {
        //console.log("testQuizWrong", UserElements.quizSubmitted.get(), !Sess.subStat().quiz.passed);
        if (UserElements.quizSubmitted.get()) {
            return( !Sess.subStat().quiz.passed );
        }
    },
    testQuizFailed: function() {
        //console.log("testQuizFailed", UserElements.quizSubmitted.get(), Sess.subStat().quiz.failed);
        return( Sess.subStat().quiz.failed );
    },
    testProceed: function() {
            //console.log("testProceed",  Sess.subStat().quiz.passed , Sess.subStat().quiz.failed);
            return( Sess.subStat().quiz.passed || Sess.subStat().quiz.failed );
    },
    quizTriesLeft: quizTriesLeft,
});
Template.questionBinary.helpers({
	//incorrect: function(){
		//if ( UserElements.quizSubmitted.get() &&  !Sess.subStat().quiz.passed ) {
                    //return( !this.correct );
        //}
	//},
});
Template.questionBinary.events({
	'click div.expQuestion': function (event) {
        event.stopPropagation();
        if ( event.target.hasAttribute( "checked" ) ) {
            event.currentTarget.setAttribute( "choice", event.target.getAttribute("choice") );
        } else {
            event.currentTarget.removeAttribute( "choice" );
        }
    },
	//'click .control-label': function (event) {
        //event.currentTarget.setAttribute( "GGG", "hello" );
        //event.currentTarget.setAttribute( "choice", event.target.getAttribute("choice") );
        //console.log( "inbutton", event.target.id, event.target.getAttribute("choice"), event.this.id, event.this.getAttribute("choice"));
    //}
});

