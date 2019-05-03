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

//BJM this file was created by copying quiz.js and them combing through experiment.js and adding certain functionality

// controller
Template.training.onCreated( function(){ // BJM
    // interaction elements
    UserElements.allQuestionsAnswered = new ReactiveVar(false);
	// make client side subject available
    let muid = Meteor.userId();
    // BJM YELLOWALERT let instance = this;
    
	// BJM YELLOWALERT this is in quiz.js but not in experiment.js, unsure why but it makes training page load a blank appearance //let subscription = instance.subscribe('s_status');
    
	// BJM UserElements.quizSubmitted = new ReactiveVar( false );
    // BJM UserElements.quizTriesLeft = new ReactiveVar( Design.maxQuizFails );
    /* BJM instance.autorun(function () {
        if (subscription.ready()) {
            //console.log("onCreated",  Sess.quizTriesLeft( muid ) , Design.maxQuizFails );
            UserElements.quizSubmitted.set( Sess.quizTriesLeft( muid ) != Design.maxQuizFails );
            UserElements.quizTriesLeft.set( Sess.quizTriesLeft( muid ) );
        }
    });*/
	
	// BJM I reviewed code in .onCreated for experiment.js, nothing to add here
	
	
});


Template.answersForm.events({
    'submit form.answersForm#training, submit form.answersForm#posttraining': function(e) {
		
		e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        let sub = Sess.subStat();


        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        // AHHHHHHHH
        //Meteor.call( "setReadyToProceed", Meteor.userId() );
        //return;
        // AHHHHHHHH
        let answeredCount = 0;
        let resultsCount = 0;
        let form = e.target; // BJM just noting that in experiment.js this is inside the qs.forEach loop...
        let qs = Template.currentData().questionsColl ? Template.currentData().questionsColl.fetch() : [];
        qs.forEach( function( q ) {
            
			let element_raw = $(form).find(".expQuestion#"+q._id)[0];
            //console.log("qs", element_raw, q, q._id);
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            let correct = ( choice === q.correctAnswer[0] ); // BJM Training has correct answers, Quiz did not
            let hasError = false;
			
            // double check correctness before udpating
            let theData = {
				correct: correct, //schema
				answered: answered,
				choice : choice,
				hasError : hasError, // BJM added these next three from experiment.js
				choiceMadeTime : UserElements.choiceChecked.get( q._id + "_choiceMadeTime" ),
                choiceLoadedTime : UserElements.choiceChecked.get( q._id + "_choiceLoadedTime" ),
                choiceSubmittedTime : Date.now(),
				};
            
			if ( !answered || !Match.test(q, Schemas.TrainingAnswers) ) { // BJM, removed '!correct ||' condition because we don't care if answers are correct as condition to proceed if ( !answered || !correct || !Match.test(q, Schemas.TrainingAnswers) ) {
                correct: theData.correct = false; // BJM YELLOWALERT I don't understand what this section of code is doing...
                theData.hasError = true;
                UserElements.questionsIncomplete.set(true); //except this I added here for UI, patterning after experiment, to get answersForm message 'you didn't answer all the questions'
				Schemas.TrainingAnswers.validate( q );
                // BJM console.log("Quiz Failure", answered, correct, Match.test(theData, Schemas.TrainingAnswers)); // remnant from Quiz
            } else {
                answeredCount += 1;
				console.log("Question answered");
                // BJM resultsCount += correct ? 1 : 0; // we don't care if correct
            }
			
			_.assign(q, theData); // client side update: assign is a mutator of q
			
            Meteor.call("updateSubjectQuestion", sub.meteorUserId, q._id, theData ); //server side update (async) //optional?
        });
        //console.log("counts", qs.length, answeredCount, resultsCount, qs.map( (q) => q._id ));
        //if ( answeredCount === qs.length ) {
        if ( answeredCount === qs.length ) { // BJM if ( true ) {
            /* BJM let passed = false; // BJM all of this is quiz related
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
            } */
            /////////////////////
            //// IF INPUTS OK, SUBMIT ANSWERS AND ....
            /////////////////////
            /* BJM let quizObj = {"passed" : passed, "failed" : failed, "triesLeft" : triesLeft};
            Meteor.call('updateQuiz', muid, quizObj );
			*/
			
			// BJM START added from experiment.js
			UserElements.allQuestionsAnswered.set(true);
			let design = Sess.design();
			let lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[ sub.sec_now ].roundCount - 1 ) );
			qs.forEach( function( q ) {
                //console.log("inserting q", q);
                Meteor.call("insertQuestionToSubData", Meteor.userId(), q );
            });
			// BJM END added from experiment.js
			
            // caluclate earnings (in case there is an earnings change after quiz, like recieivng the endowment
            Meteor.call("updateExperimentEarnings", muid, Sess.design());


            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
            // BJM I replaced this entire section with that from experiment.js
			Meteor.call('advanceSubjectState', Meteor.userId(), lastGameRound,
                function(err, updatedSub) {

                    // experiment navigation
                    //console.log("disabling q's", qs.map( (q) => q._id ) );
                    Meteor.call( "disableQuestions", qs.map( (q) => q._id ), false );
                    if ( !lastGameRound ) {  // calculate the logic for this out of the callbacks because things get confusing
                        //console.log("continuing");
                        // go to the next round
                        // uncheck buttons in UI
                        Helper.buttonsReset( e.currentTarget );
                        UserElements.questionsIncomplete.set(false);
                        // create the next cohort object (which might have no members actually);
                        // routing?
                        //Router.go('/experiment');
                        Helper.windowAdjust(updatedSub );
                    } else {
                        //console.log("ready?");
                        // http://stackoverflow.com/questions/11715646/scroll-automatically-to-the-bottom-of-the-page
                        Meteor.call( "setReadyToProceed", muid, function(err) {
                            Helper.windowAdjust(updatedSub, bottom=true );
                        } );
                    }

                });
		}
    },
});
Template.main.events({
    'click button.proceedButton#training, click button.proceedButton#posttraining': function ( e ) {
        // BJM added and modded from experiment.js
		//e.stopPropagation();
		let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button#proceedButton#quiz", sub);
        if ( sub && sub.readyToProceed ) {
             
			if ( sub.sec_now === "training" ) {
			 
				Meteor.call("advanceSubjectSection", muid, "experiment1", "experiment", asyncCallback=function(err, updatedSub) {
					if (err) { throw( err ); }
					Meteor.call('initializeSection', sub=updatedSub, lastDesign=Sess.design());
					});
            
            }
			
			if ( sub.sec_now === "posttraining" ) {
			
				// BJM YELLOWALERT based on my understanding and the original experiment.js for proceeding from 'experiment2' to the 'survey', we don't call 'initializeSection' here because the bulk of that function is specific to experiment/cohort relevant sections, so we just call 'addSectionQuestions' and then advance
				if (!sub.isExperienced) {
                    Meteor.call("addSectionQuestions", sub, "survey", Sess.design() );
                }
				
				Meteor.call('advanceSubjectSection', Meteor.userId(), "survey", "experiment");
            
            }

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
	
	// borrowing from experiment.js for functionality to check if all questions answered
	testQuizIncomplete: function() {
        //console.log("testQuizIncomplete", this);
        let dataContext = this;
        return( UserElements.questionsIncomplete.get()); /// this is just a stub <- Seth's comment; BJM says this ReactiveVar is in elements.js, for the answersForm template
    },


    //testQuizSubmitted: function() {
        //return( UserElements.quizSubmitted.get() );
    //},
	// BJM removing the functions below because as far as I can tell they're only called in elements.html when section is quiz
	/*testQuizPassed: function() {
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
    quizTriesLeft: quizTriesLeft,*/
});

Template.trainingFeedbackText.helpers({
	getIsCorrect: function( question ){
		if (!question.correct ) {
			return("not-correct");
		}
	},
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

