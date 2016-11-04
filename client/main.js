/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Helper } from '../imports/lib/helper.js';
import { Sess } from '../imports/lib/quick-session.js';
import 'bootstrap-sass';

import '../imports/startup/client/routes.js';
import './templates/experimenter-view.html';
import './templatejs/experimenter-view.js';
import './templates/instruction.html';
import './main.html';

Tracker.autorun(function() {
    if (TurkServer.inExperiment()) {
        Router.go('/experiment');
    } else if (TurkServer.inQuiz()) {
        Router.go('/start');
    } else if (TurkServer.inExitSurvey()) {
        Router.go('/survey');
    } else {
        //console.log("failed into lobby");
    }
});

Tracker.autorun(function() {
    //let state;
    //if ( Meteor.users.findOne( Meteor.userId() )) {
        //state = Meteor.users.findOne( Meteor.userId().turkserver.state );
    //}
    //console.log( "state", state );
    if ( TurkServer.inQuiz() ) {
        Meteor.subscribe('s_status');
    } else if ( TurkServer.inExitSurvey() ) {
        Meteor.subscribe('s_status');
        Meteor.subscribe('s_data');
    } else if ( TurkServer.inExperiment() ) {
        let group = TurkServer.group();
        console.log("group", group);
        if (_.isNil(group) ) return;
        //Meteor.subscribe('s_data', group);
        //Meteor.subscribe('s_status', group);
        //Meteor.subscribe('designs', group);
        Meteor.subscribe('s_data');
        Meteor.subscribe('s_status');
        Meteor.subscribe('designs');
    }
});

Tracker.autorun(function() {
    UserElements.choiceChecked = new ReactiveVar("");
    UserElements.pleaseMakeChoice = new ReactiveVar(false);
    UserElements.userAccount = new ReactiveVar();
});

Tracker.autorun(function() {
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
});

Template.experiment.onCreated( function(){
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
    // make client side subject available
    let muid = Meteor.userId();
    if ( muid ) {
        // is player refreshing, reconnecting, or somehow already up to date in the system?
        Meteor.call("playerHasConnectedBefore", muid, function(err,sData) { // think of this cb as an if statement
            let newSub, newCohort;
            if ( _.isEmpty( sData ) ) { // player is new to me
                // record groupid, in case I need it one day
                //console.log("new sub");
                Meteor.call("addGroupId", muid, group );
                Meteor.call('initializeRound', sub=muid, lastDesign=null, asyncCallback=function(err, data) {
                    if (err) { throw( err ); }
                    newSub = _.assign( data.s_status, data.s_data);
                    newCohort = data.design;
                } );
            } else { // player is refreshing or reconnecting
                //console.log("returning sub");
                newSub = _.assign( SubjectsStatus.findOne( {meteorUserId : muid }), sData );
                newCohort = CohortSettings.findOne( { cohortId : sData.cohortId, sec : sData.sec, sec_rnd : sData.sec_rnd });
            }
            //console.log("setting client side");
            Sess.setClientSub( newSub );
            Sess.setClientDesign( newCohort );
        });
    }
});

Template.experiment.helpers({
    showExperimenterView: function() {
        return( UserElements.experimenterView || TurkServer.isAdmin() );
    },
});

Template.queueInstructions.onCreated( function(){
});
Template.queueInstructions.helpers({
    counterA: function () {
        return Sess.sub().queueCountA || "XXX";
    },
    counterB: function () {
        return Sess.sub().queueCountB || "XXX";
    },
    choiceChecked: function () {
        return UserElements.choiceChecked.get();
    },
    counterNet: function () {
        return Sess.sub().queuePosition || "XXX";
    },
    userAccount: function () {
        if (!UserElements.userAccount.get()) {
            let des = Sess.design();
            UserElements.userAccount.set(des.endowment);
        }
        return( Helper.toCash( UserElements.userAccount.get() ) );
    },
    earningsAMin: function () {
        let sub = Sess.sub();
        let aDesign = Sess.design();
        let qPos = sub.queuePosition * aDesign.positionCosts;
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 - qPos ) );
    },
    earningsAMax: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 ) );
    },
    earningsBMin: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B ) );
    },
    earningsBMax: function () {
        let sub = Sess.sub();
        let aDesign = Sess.design();
        let qPos = sub.queuePosition * aDesign.positionCosts;
        return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B + 1.00 - qPos ) );
    },
    groupSize: function () {
        let aDesign = Sess.design();
        return( aDesign.maxPlayersInCohort || "XXX");
    },
    positionCosts: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.positionCosts ) );
    },
    endowment: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.endowment ) );
    },
    pot: function () {
        let aDesign = Sess.design();
        return( Helper.toCash( aDesign.pot ) );
    },
});
Template.binaryForcedChoice.helpers({
    checked: function( cInput ) {
        //console.log("checked", cInput);
        let rVal = "";
        if (UserElements.choiceChecked.get() === cInput) {
            rVal = "checked";
        }
        return rVal;
    },
});

Template.binaryForcedChoice.events({
	'click button.expChoice': function (event) {
        let des = Sess.design();
        if (UserElements.choiceChecked.get() === event.target.getAttribute("choice") ) {
            UserElements.choiceChecked.set("");
            UserElements.userAccount.set(des.endowment);
        } 
        else {
            UserElements.choiceChecked.set(event.target.getAttribute("choice"));
            UserElements.userAccount.set(des.endowment - des.queueCosts[ event.target.getAttribute("choice") ]);
            UserElements.pleaseMakeChoice.set( false);
        }
	}, 
});

Template.quiz.onCreated( function(){
    let answer;
    if ( _.random() === 0 ) {
        answer = "A";
    } else {
        answer = "B";
    }
    answer = "A"; //tmp

    let muid = Meteor.userId();
    UserElements.quizQuestion = new ReactiveVar(answer);
    UserElements.quizAnswer = new ReactiveVar(answer);
    UserElements.quizFailed = new ReactiveVar(false);
    UserElements.quizTriesLeft = new ReactiveVar( Design.maxQuizFails - Sess.quizTries( muid ) );
});
Template.quiz.helpers({
    question: function() { return( UserElements.quizQuestion.get() ); },
    //answer: function() { return( UserElements.quizAnswer.get() ) },
    testQuizWrong: function() {
        return( UserElements.quizFailed.get() );
    },
    quizTriesLeft: function() {
        let muid = Meteor.userId();
        return( Design.maxQuizFails - Sess.quizTries( muid ) );
    },
});
Template.quizWrong.helpers({
    quizTriesLeft: function() {
        let muid = Meteor.userId();
        return( Design.maxQuizFails - Sess.quizTries( muid ) );
    },
});
Template.proceedButton.helpers({
    testIncomplete: function() {
        return( UserElements.pleaseMakeChoice.get() );
    },
});
Template.proceedButton.events({
    'click button#exitQuiz': function ( e ) {
        let passed;
        let muid = Meteor.userId();
        let choice = UserElements.choiceChecked.get();
        let answer = UserElements.quizQuestion.get();
        let triesLeft = Design.maxQuizFails - Sess.quizTries( muid ) - 1;
        if (choice) {
            if (choice === answer) {
                passed = true;
                UserElements.quizFailed.set( !passed );
            } else {
                passed = false;
                UserElements.quizFailed.set( !passed );
                //Router.go('/survey');
            }
        UserElements.quizTriesLeft.set( triesLeft );
        Meteor.call('updateQuiz', muid, passed, triesLeft );

        }
        else {
            UserElements.pleaseMakeChoice.set( true );
        }
    },
    'click button#nextStage': function ( e ) {
        if (UserElements.choiceChecked.get()) {
            let design = Sess.design();
            let cohortId = design.cohortId;
            let sub = SubjectsStatus.findOne({ meteorUserId : Meteor.userId() });
            //console.log("nextStage", Meteor.userId(), sub);
            let next_section, next_round, lastGameRound;

            // game-specific logic here
            // the minus one is to correct for zero indexing: round zero should be able to be the first and only round
            lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[ sub.sec_now ].rounds - 1 ) );
            if ( lastGameRound ) {
                next_section = sub.sec_now + 1;
                next_round = 0;
            } else {
                next_section = sub.sec_now;
                next_round = sub.sec_rnd_now + 1;
            }

            // submit choice and do clean up on previousness
            Meteor.call('submitQueueChoice', Meteor.userId(), cohortId, sub.sec_now, sub.sec_rnd_now, UserElements.choiceChecked.get(), design, asyncCallback=function(err, data) {
                if (err) { throw( err ); }
                // determine if end of queue
                Meteor.call('tryToCompleteCohort', design);

                Meteor.call('advanceSubjectState', Meteor.userId(), next_section, next_round, 
                    function(err, updatedSub) {

                    // experiment navigation
                    if ( !lastGameRound ) {  // calculate the logic for this out of the callbacks because things get confusing
                        // go to the next round
                        // create the next cohort object (which might have no members actually);
                        Meteor.call('initializeRound', sub=updatedSub, lastDesign=design, asyncCallback=function(err, data) {
                            if (err) { console.log( err ); }
                            Sess.setClientSub( _.assign( data.s_status, data.s_data) );
                            Sess.setClientDesign( data.design );
                        });
                        // routing?
                        //Router.go('/experiment');
                    } else {
                        Meteor.call('goToExitSurvey', Meteor.userId());
                    }
                });
            });
        }
        else {
            UserElements.pleaseMakeChoice.set( true );
        }
    },
});


Template.survey.helpers({
    userSelection: function () {
        let muid = Meteor.userId();
        let sd = SubjectsData.findOne({ meteorUserId: Meteor.userId() } );
        if (muid && sd ) {
            return( sd.choice );
        }
    },
    "testQuizPassed": function() {
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId: Meteor.userId() } );
        if (muid && sub ) {
            return( sub.quiz.passed );
        }
},
});
Template.survey.events({
    'submit .survey': function (e) {
        let results = null;
        e.preventDefault();
        results = { feedback: e.target.feedback.value };
        TurkServer.submitExitSurvey(results);
    }
});
