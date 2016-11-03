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
        //var subject = Subjects.findOne({ meteorUserId:Meteor.userId() });
        //if (subject.status === 'instruction'){
            //Router.go('/instruction');
        //} else{
            Router.go('/experiment');
        //}
    } else if (TurkServer.inInstruction()) {
        Router.go('/instruction');
    } else if (TurkServer.inExitSurvey()) {
        Router.go('/survey');
    } 
});

Tracker.autorun(function() {
    let group = TurkServer.group();
    //console.log("group", group);
    if (_.isNil(group) ) return;
    //Meteor.subscribe('s_data', group);
    //Meteor.subscribe('s_status', group);
    //Meteor.subscribe('designs', group);
    Meteor.subscribe('s_data');
    Meteor.subscribe('s_status');
    Meteor.subscribe('designs');
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
    //Meteor.subscribe('s_data', group);
    //Meteor.subscribe('designs', group);
    // make client side subject available
    if (Meteor.userId()) {
        // is player refreshing, reconnecting, or somehow already up to date in the system?
        Meteor.call("playerHasConnected",Meteor.userId(), function(err,data) { // this of this as an if statement
            let liveRound = data;
            // console.log(liveRound);
            if ( _.isEmpty( liveRound ) ) { // player is new to me
                // console.log("new player", SubjectsData.find({}).fetch());
                // record groupid, in case I need it one day
                Meteor.call("addGroupId", Meteor.userId(), group );
                Meteor.call('initializeRound', sub=Meteor.userId(), lastDesign=null, asyncCallback=function(err, data) {
                    if (err) { throw( err ); }
                    // console.log("client got set during load", data.s_status.userId, data.s_status.meteorUserId );
                    Sess.setClientSub( _.assign( data.s_status, data.s_data) );
                    Sess.setClientDesign( data.design );
                } );
            } else { // player is refreshing or reconnecting
                // console.log("reconnecting");
                ss = SubjectsStatus.findOne( {meteorUserId : Meteor.userId() });
                cs = CohortSettings.findOne( { cohortId : liveRound.cohortId, sec : liveRound.sec, sec_rnd : liveRound.sec_rnd });
                Sess.setClientSub( _.assign( ss, liveRound ) );
                Sess.setClientDesign( cs );
            }
        });
    }
});

Template.experiment.helpers({
    testIncomplete: function() {
        return( UserElements.pleaseMakeChoice.get() );
    },
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
Template.queueSelections.helpers({
    checkedA: function() {
        //console.log("checkedA");
        let rVal = "";
        if (UserElements.choiceChecked.get() === "A") {
            rVal = "checked";
        }
        return rVal;
    },
    checkedB: function() {
        //console.log("checkedB");
        let rVal = "";
        if (UserElements.choiceChecked.get() === "B") {
            rVal = "checked";
        }
        return rVal;
    },
});

Template.queueSelections.events({
	'click button#clickMeA': function (event) {
        //console.log(event.target.id);
        let des = Sess.design();
        if (UserElements.choiceChecked.get() === "A") {
            UserElements.choiceChecked.set("");
            UserElements.userAccount.set(des.endowment);
        } 
        else {
            UserElements.choiceChecked.set("A");
            UserElements.userAccount.set(des.endowment - des.queueCosts.A);
            UserElements.pleaseMakeChoice.set( false);
        }
	}, 
	'click button#clickMeB': function (event) {
        //console.log(event.target.id);
        let des = Sess.design();
        if (UserElements.choiceChecked.get() === "B") {
            UserElements.choiceChecked.set("");
            UserElements.userAccount.set(des.endowment);
        } 
        else {
            UserElements.choiceChecked.set("B");
            UserElements.userAccount.set(des.endowment - des.queueCosts.B);
            UserElements.pleaseMakeChoice.set( false );
        }
	},
});

Template.experimentSubmit.events({
    'click button#exitSurvey': function () {
        if (UserElements.choiceChecked.get()) {
            let design = Sess.design();
            let cohortId = design.cohortId;
            let sub = Sess.sub();
            //console.log("TESTTT", sub.sec_rnd, sub.sec_rnd_now, gameRound);
            // the minus one is to correct for zero indexing: round zero should be abel to o be the first and only round
            let lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[sub.sec_now].rounds - 1 ) );
            // DEVELOPMENT if no mongo state but yes client state, wipe client state
            //if (typeof SubjectsStatus.findOne({ meteorUserId : sub.meteorUserId }) === "undefined") {
                //Sess.wipeClientState();
            //}
            Meteor.call('submitQueueChoice', Meteor.userId(), cohortId, sub.sec_now, sub.sec_rnd_now, UserElements.choiceChecked.get(), lastGameRound, design, asyncCallback=function(err, data) {
                if (err) { throw( err ); }
                // determine if end of queue
                Meteor.call('completeCohort', design, asyncCallback=function(err, data) {
                    if (err) { throw( err ); }
                    //if end of queue, calculate all earnings
                    let design = data;
                    let completedCohort = data.completedCohort ;
                    if ( completedCohort ) {
                        Meteor.call( 'calculateQueueEarnings', design );
                    }

                    // experiment navigation
                    if ( !lastGameRound ) {  // calculate the logic for this out of the callbacks because things get confusing
                        // go to the next round
                        // get fresh subject
                        sub = SubjectsStatus.findOne({ meteorUserId : sub.meteorUserId });
                        // create the next cohort object (which might have no members actually);
                        Meteor.call('initializeRound', sub=sub, lastDesign=design, asyncCallback=function(err, data) {
                            if (err) { console.log( err ); }
                            Sess.setClientSub( _.assign( data.s_status, data.s_data) );
                            Sess.setClientDesign( data.design );
                        });
                        // routing?
                        //Router.go('/experiment');
                    } else {
                        Meteor.call('goToExitSurvey');
                    }
                } );
            });
        }
        else {
            UserElements.pleaseMakeChoice.set( true );
        }
    }
});

Template.survey.helpers({
    userSelection: function () {
        /// return(Sess.sub().choice);
        // Outside of lobby, Session stops working.  good to know.
        return(SubjectsData.findOne({meteorUserId: Meteor.userId()}, { sort : { sec : -1, sec_rnd : -1 } } ).choice);
    },
});
Template.survey.events({
    'submit .survey': function (e) {
        e.preventDefault();
        let results = {confusing: e.target.confusing.value,
            feedback: e.target.feedback.value};
        TurkServer.submitExitSurvey(results);
    }
});
