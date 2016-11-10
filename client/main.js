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
import { Questions } from '../api/experiment.js';

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
	questions: function(){
        return Questions.find({section: 'experiment'}).fetch() ;
    },
    testProceed: Helper.testProceed,
});
Template.experiment.events({
    'submit form#nextStage': function(e){
        event.stopPropagation();
        event.preventDefault();
        let muid = Meteor.userId();
        //Only allow clients to attempt quiz twice before preventing them from doing so
        qs = Questions.find({section: 'experiment'}).forEach( function( q ) {
            let form = event.target;
            let element = $( $(form).children("div#"+q._id)[0] );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            console.log(q._id, answered, choice);
            Questions.update({_id: q._id}, {$set: { answered: answered, choice : choice }});
            // mark incorrect in DOM
        });
        let answeredCount = Questions.find({section: 'experiment', answered:true}).count();
        let questionsCount = Questions.find({section: 'experiment'}).count();
        let choice = Questions.findOne({section: 'experiment'}).choice;
        console.log(Questions.findOne({section: 'experiment'}));

        if ( answeredCount === questionsCount ) {
            let design = Sess.design();
            let cohortId = design.cohortId;
            let sub = SubjectsStatus.findOne({ meteorUserId : Meteor.userId() });
            let next_section, next_round, lastGameRound;

            // game-specific logic here
            // the minus one is to correct for zero indexing: round zero should be able to be the first and only round
            //  the maxes and mins are to get sane section values while development
            lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[ _.min( [ sub.sec_now, _.max( _.map( _.keys( design.sequence ), _.toInteger ) ) ] ) ].rounds - 1 ) );
            //console.log( lastGameRound );
            if ( lastGameRound ) {
                next_section = sub.sec_now + 1;
                next_round = 0;
            } else {
                next_section = sub.sec_now;
                next_round = sub.sec_rnd_now + 1;
            }

            // submit choice and do clean up on previousness
            Meteor.call('submitQueueChoice', Meteor.userId(), cohortId, sub.sec_now, sub.sec_rnd_now, choice, design, asyncCallback=function(err, data) {
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
	'click form#nextStage': function (event) {
        console.log("click form#nextStage");
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
    choiceChecked: function ( ) {
        let theId = Questions.findOne({ section: "experiment" })._id;
        return UserElements.choiceChecked.get( theId );
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
});

Template.binaryForcedChoice.events({
	'click button.expChoice': function (event) {
        console.log("button.expChoice");
    },
	'click div.expChoices': function (event) {
        console.log("div.expChoices");
        if ( event.target.hasAttribute( "checked" ) ) {
            event.currentTarget.removeAttribute( "choice" );
        } else {
            event.currentTarget.setAttribute( "choice", event.target.getAttribute("choice") );
        }
        for (let child of event.currentTarget.children) {
            if ( event.target.getAttribute("choice") === child.getAttribute("choice") && !child.hasAttribute("checked")) {
                child.setAttribute("checked", '');
            } 
            else {// uncheck a checked button
                child.removeAttribute("checked");
            }
        }
	}, 
});
Template.questionBinary.events({
	'click div.expQuestion': function (event) {
        console.log("div.expQuestion");
        event.stopPropagation();
        let des = Sess.design();
        let buttonId = event.currentTarget.id; // currentTarget is the div wrapper, target is each button within in
        let choice = event.currentTarget.getAttribute("choice");
        console.log("div check", buttonId, choice);
        UserElements.choiceChecked.set(buttonId, choice);
        if (choice) {
            event.currentTarget.setAttribute( "choice", choice );
            UserElements.userAccount.set(des.endowment - des.queueCosts[ event.target.getAttribute("choice") ]);
            UserElements.pleaseMakeChoice.set( false);
        } else {
            UserElements.userAccount.set(des.endowment);
            event.currentTarget.removeAttribute( "choice" );
        }
        if (false){
            if ( event.target.hasAttribute( "checked" ) ) {
                console.log("div check");
                event.currentTarget.setAttribute( "choice", event.target.getAttribute("choice") );
                UserElements.choiceChecked.set(buttonId, event.target.getAttribute("choice"));
                UserElements.userAccount.set(des.endowment - des.queueCosts[ event.target.getAttribute("choice") ]);
                UserElements.pleaseMakeChoice.set( false);
            } else {
                console.log("div uncheck");
                event.currentTarget.removeAttribute( "choice" );
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

