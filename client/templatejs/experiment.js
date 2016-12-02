/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep.js';
import { Schemas } from '../../api/design/schemas.js';


Template.experiment.onCreated( function(){

    let group = TurkServer.group();
    if (_.isNil(group) ) return;
    // make client side subject available
    let muid = Meteor.userId();
    let templateCurrentData = Template.currentData();
    //console.log("MUID", muid);
    if ( muid ) {
        // is player refreshing, reconnecting, or somehow already up to date in the system?
        //console.log("experiment render", this, Template.currentData());
        console.log("experiment render", Template.currentData());
        Meteor.call("playerHasConnectedBefore", muid, function(err,state) { // think of this cb as an if statement
            let newData, newCohort;//, updateSession;
            let sub = state.status;
            let data = state.data;
            if ( !sub.readyToProceed && _.isEmpty( data ) ) { // player is new to me if they are int he experiment, they have no incomplete data, and they aren't ready to proceeed to a next stage
                // record groupid, in case I need it one day
                console.log("new sub");
                Meteor.call("addGroupId", muid, group );
                Meteor.call('initializeRound', sub=muid, lastDesign=null, asyncCallback=function(err, data) {
                    if (err) { throw( err ); }
                    //console.log("initializeRound", data.s_data.theData.cohortId, data.design.cohortId);
                    //updateSession = true;
                    newData = { "status" : data.s_status, "data" : data.s_data };
                    newCohort = data.design;
                } );
            } else if ( sub.sec_type_now === "experiment" && _.some( data, (x) => x.completedChoice === false ) ) { // player is refreshing or reconnecting mid choice in experiment
                //updateSession = false;
            } else if ( sub.sec_type_now === "experiment" && _.every( data, (x) => x.completedChoice === true ) ) { // player is refreshing or reconnecting post choice in experiment
                //updateSession = false;
            }
            //if (updateSession) {
                ////console.log("setting client side");
                //Sess.setClientSub( newData );
                //Sess.setClientDesign( newCohort );
            //}

        });
        //update ui
        let currentSection = templateCurrentData.currentSection;
        let subStat = templateCurrentData.subStat;
        // AND?
    }
});

Template.experiment.helpers({
	questions: function(){
        //console.log("experiment.helpers", this);
        let sub = Sess.subStat();
        let dataContext = this;
        if (dataContext.currentSection) {
            return( Helper.questions( sub, dataContext.currentSection.id, dataContext) );
        }
    },
    testProceed: Helper.testProceed,
    section: function() {
        //console.log( "expeirment.helper section", this );
        let dataContext = this;
        return( dataContext.currentSection );
    },
    subjectStatus: function() {
        let dataContext = this;
        return( dataContext.subStat );
    },
});
Template.experiment.events({
    'submit form#nextStage': function(e){
        console.log("experiment.events submit", this, e);
        e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        let sub = Sess.subStat();

        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        //Only allow clients to attempt quiz twice before preventing them from doing so
        let qs = Questions.find({sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now }).forEach( function( q ) {
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
        let answeredCount = Questions.find({sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now , answered:true}).count();
        let questionsCount = Questions.find({sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now }).count();
        //console.log(sub.sec_rnd_now, Questions.findOne({sec: this.currentSection.id}));
        let choice = Questions.findOne({sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now }).choice;

        if ( answeredCount === questionsCount ) {
            let design = Sess.design();
            let cohortId = design.cohortId;

            /////////////////////
            //// IF INPUTS OK, SUBMIT ANSWERS AND ....
            /////////////////////
            // AHHHHHHHH
            //Meteor.call( "setReadyToProceed", Meteor.userId() );
            //return;
            // AHHHHHHHH

            // game-specific logic here
            // the minus one is to correct for zero indexing: round zero should be able to be the first and only round
            //  the maxes and mins are to get sane section values while development
            let lastGameRound = ( sub.sec_rnd_now >= ( design.sequence[ sub.sec_now ].roundCount - 1 ) );

            //console.log( "submitting answers, advancing state", design, lastGameRound );
            //console.log( lastGameRound );
            let subData = SubjectsData.findOne({ meteorUserId: Meteor.userId() , "theData.cohortId" : cohortId, sec : sub.sec_now, sec_rnd : sub.sec_rnd_now });
            let theData = subData.theData;
            theData.choice = choice; // user input might be dirty;
            try {
                check(theData, Schemas.ExperimentAnswers);
            } catch (err) {
                console.log("Data failed validation");
                throw(err);
            }
            // continue if clean
            // experiment-specific logic
            if (choice === "A") {
                theData.earnings1 = design.endowment - design.queueCosts.A;
            } else if (choice === "B") {
                theData.earnings1 = design.endowment - design.queueCosts.B;
            }
            

            // submit choice and do clean up on previousness
            Meteor.call('submitExperimentChoice', Meteor.userId(), sub.sec_now, sub.sec_rnd_now, theData, asyncCallback=function(err, data) {
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
                        //console.log("continuing");
                        // go to the next round
                        // uncheck buttons in UI
                        Helper.buttonsReset( e.currentTarget );
                        // create the next cohort object (which might have no members actually);
                        Meteor.call('initializeRound', sub=updatedSub, lastDesign=design, asyncCallback=function(err, data) {
                            if (err) { return(err); }
                            //Sess.setClientSub( { "status" : data.s_status, "data" : data.s_data } );
                            //Sess.setClientDesign( data.design );
                        });
                        // routing?
                        //Router.go('/experiment');
                    } else {
                        //console.log("ready?");
                        Meteor.call( "setReadyToProceed", muid );
                        Helper.buttonsDisable( e.currentTarget );
                    }

                });

        }
    },
    'click button#nextSection': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        if ( sub.readyToProceed ) {
            if (sub.sec_now === "experiment1" ) {
                Meteor.call('advanceSubjectSection', Meteor.userId(), "experiment2", "experiment", asyncCallback=function(err, updatedSub) {
                    if (err) { throw( err ); }
                    Meteor.call('initializeRound', sub=updatedSub, lastDesign=Sess.design());
                });
            } else if (sub.sec_now === "experiment2" ) {
                Meteor.call('advanceSubjectSection', Meteor.userId(), "survey", "experiment");
            }
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
        if (sub) {
            //console.log("experimentInfo.helpers", this, sub );
            let q = Questions.findOne({ sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now });
            //console.log("experimentInfo.helpers", this, sub, q );
            if (UserElements.choiceChecked && !_.isNil(sub) && !_.isNil( q )) {
                return UserElements.choiceChecked.get( q._id );
            }
        }
    },
    counterNet: function () {
        let data = Sess.subData();
        if( data && !_.isNil( data ) && !_.isNil( data[0] ) ) {
            return data[0].theData.queuePosition;
        }
    },
    userAccount: function () {
        let des = Sess.design();
        if (UserElements.userAccount && des) {
            if (!UserElements.userAccount.get()) {
                UserElements.userAccount.set(des.endowment);
            }
            return( Helper.toCash( UserElements.userAccount.get() ) );
        }
    },
    groupSize: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( aDesign.maxPlayersInCohort);
        }
    },
});

Template.questionBinary.events({
	'click div.expQuestion': function (e) {
        e.stopPropagation();
        let questionData = this;
        //console.log("div.experimentQuestion", this, e.currentTarget.getAttribute("choice"), e.target.getAttribute("choice"));
        if ( questionData.context.currentSection.type === "experiment" ) {
            let des = Sess.design();
            let choice = e.target.getAttribute("choice");
            let buttonId = e.currentTarget.id; // currentTarget is the div wrapper, target is each button within in
            //console.log("div.experimentQuestion", buttonId, choice, e.currentTarget.getAttribute("choice"), e.target.getAttribute("choice"));
            if ( !_.isNil( choice ) && e.currentTarget.getAttribute("choice") != choice ) {
                //console.log("div.experimentQuestion check", this, des, SubjectsData.find().fetch() );
                e.currentTarget.setAttribute( "choice", choice );
                UserElements.userAccount.set(des.endowment - des.queueCosts[ e.target.getAttribute("choice") ]);
                UserElements.choiceChecked.set(buttonId, choice);
            } else { // uncheck
                //console.log("div.experimentQuestion uncheck");
                e.currentTarget.removeAttribute( "choice" );
                UserElements.userAccount.set(des.endowment);
                UserElements.choiceChecked.set(buttonId, "");
            }
        }
    },
});



