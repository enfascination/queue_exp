/*jshint esversion: 6 */

var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Sess } from '../../imports/lib/quick-session.js';

// multi-template helpers
const quizTriesLeft = function quizTriesLeft() {
    let muid = Meteor.userId();
    return( Design.maxQuizFails - Sess.quizTries( muid ) );
};

Template.quiz.helpers({
    question: function() { return( UserElements.quizQuestion.get() ); },
    //answer: function() { return( UserElements.quizAnswer.get() ) },
    testQuizWrong: function() {
        return( UserElements.quizFailed.get() );
    },
    quizTriesLeft: quizTriesLeft,
});
Template.quizWrong.helpers({
    quizTriesLeft: quizTriesLeft,
});

Template.quiz.onCreated( function(){
    let answer;
    if ( _.random() === 0 ) {
        answer = "A";
    } else {
        answer = "B";
    }
    //answer = "A"; //tmp

    let muid = Meteor.userId();
    UserElements.quizQuestion = new ReactiveVar(answer);
    UserElements.quizAnswer = new ReactiveVar(answer);
    UserElements.quizFailed = new ReactiveVar(false);
    UserElements.quizTriesLeft = new ReactiveVar( Design.maxQuizFails - Sess.quizTries( muid ) );
});
