/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';
import 'bootstrap-sass';

import '../imports/startup/client/routes.js';
import { Helper } from '../imports/lib/helper.js';
import { Sess } from '../imports/lib/quick-session.js';
import { Questions } from '../imports/startup/experiment.js';

import './templatejs/quiz.js';
import './templatejs/experimenter-view.js';
import './templatejs/survey.js';
import './main.html';
import './templates/quiz.html';
import './templates/experimenter-view.html';
import './templates/survey.html';

Tracker.autorun(function() {
    //console.log("routing");
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
        Meteor.subscribe('s_data');
    } else if ( TurkServer.inExitSurvey() ) {
        Meteor.subscribe('s_status');
        Meteor.subscribe('s_data');
    } else if ( TurkServer.inExperiment() ) {
        let group = TurkServer.group();
        //console.log("group", group);
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
    //initialize ui state
    UserElements.choiceChecked = new ReactiveDict(); // this is so there can be mulplie of these buttons on a page
    UserElements.userAccount = new ReactiveVar();
    UserElements.pleaseMakeChoice = new ReactiveVar(false);
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
                    newSub = { "status" : data.s_status, "data" : data.s_data };
                    newCohort = data.design;
                } );
            } else { // player is refreshing or reconnecting
                //console.log("returning sub");
                newSub = { "status" : SubjectsStatus.findOne( {meteorUserId : muid }), "data" : sData };
                newCohort = CohortSettings.findOne( { cohortId : sData.theData.cohortId, sec : sData.sec, sec_rnd : sData.sec_rnd });
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
	questions: function(){
        let sub = Sess.subStat();
        return Questions.find({section: 'experiment', round : sub.sec_rnd_now }).fetch() ;
    },
    testProceed: Helper.testProceed,
});
Template.experiment.events({
    'submit form#nextStage': function(e){
        e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });
        //Only allow clients to attempt quiz twice before preventing them from doing so
        let qs = Questions.find({section: 'experiment', round : sub.sec_rnd_now }).forEach( function( q ) {
            let form = e.target;
            let element_raw = $(form).children("div#"+q._id)[0];
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            Questions.update({_id: q._id}, {$set: { answered: answered, choice : choice }});
            if (!answered) {
                Helper.questionHasError( element_raw, true );
            } else {
                Helper.questionHasError( element_raw, false );
            }
        });
        let answeredCount = Questions.find({section: 'experiment', round : sub.sec_rnd_now , answered:true}).count();
        let questionsCount = Questions.find({section: 'experiment', round : sub.sec_rnd_now }).count();
        //console.log(sub.sec_rnd_now, Questions.findOne({section: 'experiment'}));
        let choice = Questions.findOne({section: 'experiment', round : sub.sec_rnd_now }).choice;

        if ( answeredCount === questionsCount ) {
            let design = Sess.design();
            let cohortId = design.cohortId;

            // game-specific logic here
            // the minus one is to correct for zero indexing: round zero should be able to be the first and only round
            //  the maxes and mins are to get sane section values while development
            let lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[ sub.sec_now ].rounds - 1 ) );
            //console.log( lastGameRound );

            // submit choice and do clean up on previousness
            Meteor.call('submitQueueChoice', Meteor.userId(), cohortId, sub.sec_now, sub.sec_rnd_now, choice, design, asyncCallback=function(err, data) {
                if (err) { throw( err ); }
                // determine if end of queue
                Meteor.call('tryToCompleteCohort', design);

                Meteor.call('advanceSubjectState', Meteor.userId(), 
                    function(err, updatedSub) {

                    // experiment navigation
                    if ( !lastGameRound ) {  // calculate the logic for this out of the callbacks because things get confusing
                        // go to the next round
                        // uncheck buttons in UI
                        Helper.buttonsReset( e.currentTarget );
                        // create the next cohort object (which might have no members actually);
                        Meteor.call('initializeRound', sub=updatedSub, lastDesign=design, asyncCallback=function(err, data) {
                            if (err) { console.log( err ); }
                            Sess.setClientSub( { "status" : data.s_status, "data" : data.s_data } );
                            Sess.setClientDesign( data.design );
                        });
                        // routing?
                        //Router.go('/experiment');
                    } else {
                        Meteor.call( "setReadyToProceed", muid );
                        Helper.buttonsDisable( e.currentTarget );
                    }
                });
            });
        }
    },
    'click button#nextSection': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });
        if ( sub.readyToProceed ) {
            UserElements.pleaseMakeChoice.set( false );
            Meteor.call('advanceSubjectSection', Meteor.userId());
            Meteor.call('goToExitSurvey', Meteor.userId());
        } else {
            UserElements.pleaseMakeChoice.set( true );
        }
    },
	'click form#nextStage': function (e) {
        //console.log("click form#nextStage");
    },
});

Template.queueInstructions.onCreated( function(){
});
Template.queueInstructions.helpers({
    counterA: function () {
        return Sess.subData().theData.queueCountA || "XXX";
    },
    counterB: function () {
        return Sess.subData().theData.queueCountB || "XXX";
    },
    choiceChecked: function ( ) {
        let sub = Sess.subStat();
        let q = Questions.findOne({ section: "experiment", round : sub.sec_rnd_now });
        //console.log( sub );
        if (!_.isNil(sub) && !_.isNil( q )) {
            return UserElements.choiceChecked.get( q._id );
        }
    },
    counterNet: function () {
        if (Sess.subData() && Sess.subData().theData) {
            return Sess.subData().theData.queuePosition || "XXX";
        }
    },
    userAccount: function () {
        if (!UserElements.userAccount.get()) {
            let des = Sess.design();
            UserElements.userAccount.set(des.endowment);
        }
        return( Helper.toCash( UserElements.userAccount.get() ) );
    },
    earningsAMin: function () {
        let sub = Sess.subData();
        let aDesign = Sess.design();
        if ( sub && sub.theData ) {
            let qPos = sub.theData.queuePosition * aDesign.positionCosts;
            return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 - qPos ) );
        }
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
        let sub = Sess.subData();
        let aDesign = Sess.design();
        if ( sub && sub.theData ) {
            let qPos = sub.theData.queuePosition * aDesign.positionCosts;
            return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B + 1.00 - qPos ) );
        }
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
	disabled: function( id ){
        if( Questions.findOne( { _id : id } ).disabled ) {
            return("disabled");
        }
	},
});

Template.binaryForcedChoice.events({
	'click button.expChoice': function (e) {
        //console.log("button.expChoice");
    },
	'click div.expChoices': function (e) {
        //console.log("div.expChoices");
        if ( e.target.hasAttribute( "checked" ) ) {
            e.currentTarget.removeAttribute( "choice" );
        } else {
            e.currentTarget.setAttribute( "choice", e.target.getAttribute("choice") );
        }
        for (let child of e.currentTarget.children) {
            if ( e.target.getAttribute("choice") === child.getAttribute("choice") && !child.hasAttribute("checked")) {
                child.setAttribute("checked", '');
            } 
            else {// uncheck a checked button
                child.removeAttribute("checked");
            }
        }
	}, 
});
Template.questionBinary.helpers({
	hasError: function( id ){
        if (Questions.findOne( id ).hasError ) {
            return("has-error");
        }
	},
});

Template.questionBinary.events({
	'click div.expQuestion': function (e) {
        //console.log("div.expQuestion");
        e.stopPropagation();
        let des = Sess.design();
        let buttonId = e.currentTarget.id; // currentTarget is the div wrapper, target is each button within in
        let choice = e.currentTarget.getAttribute("choice");
        UserElements.choiceChecked.set(buttonId, choice);
        if (choice) {
            e.currentTarget.setAttribute( "choice", choice );
            UserElements.userAccount.set(des.endowment - des.queueCosts[ e.target.getAttribute("choice") ]);
            UserElements.pleaseMakeChoice.set( false);
        } else {
            UserElements.userAccount.set(des.endowment);
            e.currentTarget.removeAttribute( "choice" );
        }
        if (false){
            if ( e.target.hasAttribute( "checked" ) ) {
                e.currentTarget.setAttribute( "choice", e.target.getAttribute("choice") );
                UserElements.choiceChecked.set(buttonId, e.target.getAttribute("choice"));
                UserElements.userAccount.set(des.endowment - des.queueCosts[ e.target.getAttribute("choice") ]);
                UserElements.pleaseMakeChoice.set( false);
            } else {
                e.currentTarget.removeAttribute( "choice" );
                UserElements.choiceChecked.set( buttonId, "");
                UserElements.userAccount.set(des.endowment);
            }
        }
    },
});

Template.proceedButton.helpers({
    testIncomplete: function() {
        return( UserElements.pleaseMakeChoice.get() );
    },
    buttonInactive : function() {
        let sub = SubjectsStatus.findOne({ meteorUserId : Meteor.userId() });
        let rval = '';
        if( false && ( _.isNil( sub ) || !sub.readyToProceed ) ) {
            rval = "disabled";
        } else {
        }
        //console.log("diabled?", rval);
        return( rval);
    },
});
Template.proceedButton.events({
});

