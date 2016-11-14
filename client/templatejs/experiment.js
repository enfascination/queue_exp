/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep.js';


Template.body.onCreated( function(){
    //initialize ui state
    UserElements.choiceChecked = new ReactiveDict(); // this is so there can be mulplie of these buttons on a page
    UserElements.userAccount = new ReactiveVar();
});

Template.experiment.onCreated( function(){
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
    // make client side subject available
    let muid = Meteor.userId();
    //console.log("MUID", muid);
    if ( muid ) {
        // is player refreshing, reconnecting, or somehow already up to date in the system?
        //console.log("experiment render");
        Meteor.call("playerHasConnectedBefore", muid, function(err,state) { // think of this cb as an if statement
            let newData, newCohort, updateSession;
            let sub = state.status;
            let data = state.data;
            if ( _.isEmpty( data ) ) { // player is new to me if they are int he experiment, they have no incomplete data, and they aren't ready to proceeed to a next stage
                // record groupid, in case I need it one day
                console.log("new sub");
                Meteor.call("addGroupId", muid, group );
                Meteor.call('initializeRound', sub=muid, lastDesign=null, asyncCallback=function(err, data) {
                    if (err) { throw( err ); }
                    //console.log("initializeRound", data.s_data.theData.cohortId, data.design.cohortId);
                    updateSession = true;
                    newData = { "status" : data.s_status, "data" : data.s_data };
                    newCohort = data.design;
                } );
            } else if (sub.sec_now === "survey") { // player is refreshing or reconnecting in survey
                updateSession = false;
            } else if ( sub.sec_now === "experiment" && _.some( data, (x) => x.completedChoice === false ) ) { // player is refreshing or reconnecting mid choice in experiment
                updateSession = false;
            } else if ( sub.sec_now === "experiment" && _.every( data, (x) => x.completedChoice === true ) ) { // player is refreshing or reconnecting post choice in experiment
                updateSession = false;
            }
            if (updateSession) {
                //console.log("setting client side");
                Sess.setClientSub( newData );
                Sess.setClientDesign( newCohort );
            }
        });
    }
});

Template.experiment.helpers({
	questions: function(){
        let sub = Sess.subStat();
        return Questions.find({sec: 'experiment', sec_rnd : sub.sec_rnd_now }).fetch() ;
    },
    testProceed: Helper.testProceed,
});
Template.experiment.events({
    'submit form#nextStage': function(e){
        e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });

        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        //Only allow clients to attempt quiz twice before preventing them from doing so
        let qs = Questions.find({sec: 'experiment', sec_rnd : sub.sec_rnd_now }).forEach( function( q ) {
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
        let answeredCount = Questions.find({sec: 'experiment', sec_rnd : sub.sec_rnd_now , answered:true}).count();
        let questionsCount = Questions.find({sec: 'experiment', sec_rnd : sub.sec_rnd_now }).count();
        //console.log(sub.sec_rnd_now, Questions.findOne({sec: 'experiment'}));
        let choice = Questions.findOne({sec: 'experiment', sec_rnd : sub.sec_rnd_now }).choice;

        if ( answeredCount === questionsCount ) {
            let design = Sess.design();
            let cohortId = design.cohortId;

            /////////////////////
            //// IF INPUTS OK, SUBMIT ANSWERS AND ....
            /////////////////////

            // game-specific logic here
            // the minus one is to correct for zero indexing: round zero should be able to be the first and only round
            //  the maxes and mins are to get sane section values while development
            let lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[ sub.sec_now ].rounds - 1 ) );
            console.log( "submitting answers, advancing state", design, lastGameRound );
            //console.log( lastGameRound );

            // submit choice and do clean up on previousness
            Meteor.call('submitExperimentChoice', Meteor.userId(), cohortId, sub.sec_now, sub.sec_rnd_now, choice, design, asyncCallback=function(err, data) {
                if (err) { throw( err ); }
                // determine if end of cohort
                Meteor.call('tryToCompleteCohort', design);
            });

            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
            Meteor.call('advanceSubjectState', Meteor.userId(), lastGameRound,
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
        }
    },
    'click button#nextSection': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = SubjectsStatus.findOne({ meteorUserId : muid });
        if ( sub.readyToProceed ) {
            Meteor.call('advanceSubjectSection', Meteor.userId(), "survey");
        } else {
        }
    },
	'click form#nextStage': function (e) {
        //console.log("click form#nextStage");
    },
});

Template.experimentInfo.helpers({
    choiceChecked: function ( ) {
        let sub = Sess.subStat();
        let q = Questions.findOne({ sec: "experiment", sec_rnd : sub.sec_rnd_now });
        //console.log( sub );
        if (UserElements.choiceChecked && !_.isNil(sub) && !_.isNil( q )) {
            return UserElements.choiceChecked.get( q._id );
        }
    },
    counterNet: function () {
        if (Sess.subData() && Sess.subData().theData) {
            return Sess.subData().theData[0].queuePosition || "XXX";
        }
    },
    userAccount: function () {
        if (UserElements.userAccount) {
            if (!UserElements.userAccount.get()) {
                let des = Sess.design();
                UserElements.userAccount.set(des.endowment);
            }
            return( Helper.toCash( UserElements.userAccount.get() ) );
        }
    },
    groupSize: function () {
        let aDesign = Sess.design();
        return( aDesign.maxPlayersInCohort || "XXX");
    },
});

Template.questionBinary.events({
	'click div.expQuestion': function (e) {
        //console.log("div.expQuestion");
        e.stopPropagation();
        let des = Sess.design();
        let choice = e.target.getAttribute("choice");
        let buttonId = e.currentTarget.id; // currentTarget is the div wrapper, target is each button within in
        if ( !( _.isNil( choice ) || e.currentTarget.getAttribute("choice") ) ) {
            e.currentTarget.setAttribute( "choice", choice );
            UserElements.userAccount.set(des.endowment - des.queueCosts[ e.target.getAttribute("choice") ]);
            UserElements.choiceChecked.set(buttonId, choice);
        } else {
            e.currentTarget.removeAttribute( "choice" );
            UserElements.userAccount.set(des.endowment);
            UserElements.choiceChecked.set(buttonId, "");
        }
    },
});



