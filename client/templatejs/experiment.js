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
//import { Questions } from '../../imports/startup/experiment_prep_instpref.js';
import { Schemas } from '../../api/design/schemas.js';


Template.experiment.onCreated( function(){
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
    // make client side subject available
    let muid = Meteor.userId();
    //console.log("MUID", muid);
    if ( muid ) {
        let subStat = Template.currentData().subStat;
        // is player refreshing, reconnecting, or somehow already up to date in the system?
        //console.log("experiment render", Template.currentData());
        if ( !subStat.readyToProceed ) {
            let playerHasConnectedBefore     = (subStat.cohort_now !== 0);
            // player is new to me if they are int he experiment, they have no incomplete data, and they aren't ready to proceeed to a next stage
            if ( !playerHasConnectedBefore ) { 
                // record groupid, in case I need it one day
                console.log("New participant", "DON'T HAVE TO GO IN HERE ANYMORE");
                Meteor.call("addGroupId", muid, group );
                //Meteor.call('initializeSection', sub=muid, lastDesign=null );
            } 
        }

    }
});

Template.experiment.helpers({
});
Template.answersForm.helpers({
    testQuizIncomplete: function() {
        //console.log("testQuizIncomplete", this);
        let dataContext = this;
        return( UserElements.questionsIncomplete.get()); /// this is just a stub
    },
});
Template.answersForm.events({
    'submit form.answersForm#experiment1, submit form.answersForm#experiment2': function(e){
        //console.log("experiment.events submit", this, e);
        e.stopPropagation();
        e.preventDefault();
        let muid = Meteor.userId();
        let sub = Sess.subStat();

        /////////////////////
        //// ARE INPUTS ACCEPTABLE?
        /////////////////////
        //Only allow clients to attempt quiz twice before preventing them from doing so
        let answeredCount = 0;
        let qs = Template.currentData().questionsColl ? Template.currentData().questionsColl.fetch() : [];
        //let qs = Questions.find({ meteorUserId : sub.meteorUserId, sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now });
        qs.forEach( function( q ) {
            let form = e.target;
            let element_raw = $(form).find(".expQuestion#"+q._id)[0];
            let element = $( element_raw );
            let choice = element.attr("choice");
            let answered = !_.isNil( choice );
            let hasError = false;
            let theData = {
                answered: answered, 
                choice : choice, 
                hasError : hasError,
                choiceMadeTime : UserElements.choiceChecked.get( q._id + "_choiceMadeTime" ),
                choiceLoadedTime : UserElements.choiceChecked.get( q._id + "_choiceLoadedTime" ),
                choiceSubmittedTime : Date.now(),
            };
            if (!answered) {
                theData.hasError = true;
                UserElements.questionsIncomplete.set(true);
            } else {
                answeredCount += 1;
            }
            _.assign(q, theData); // client side update: assign is a mutator of q 
            //console.log("on submit", element.attr("id"), q._id, q.choiceLoadedTime, q.choiceMadeTime, q.choiceSubmittedTime, q);
            Meteor.call("updateSubjectQuestion", sub.meteorUserId, q._id, theData); //server side update (async) //optional?
        });
        //console.log("experimentSubmit", qs.length, answeredCount, sub.sec_now, sub.sec_rnd_now, Sess.design(), qs );
        if ( answeredCount === qs.length ) {
            UserElements.questionsIncomplete.set(false);
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

            //console.log( lastGameRound );
            //let choice = Questions.findOne({sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now }).choice;
            //theData.choice = choice; // user input might be dirty;

            //// continue if clean
            //// experiment-specific logic
            // when i reactive thsi, make sure that zeros questions work and the lmultiples do too
            //if (choice === "A") {
                //theData.earnings1 = design.endowment - design.queueCosts.A;
            //} else if (choice === "B") {
                //theData.earnings1 = design.endowment - design.queueCosts.B;
            //}
            if (sub.sec_rnd_now === 3) {  // experiment specific: they chose a game of two and I have to give it to them
                // pick out the right question from this round
                qs.forEach( function( q ) {
                    if (q.type !== 'chooseGame') return;
                    // find chosen game
                    //    async shouldn't be a problem because I won't need the updated question 
                    //    until initilizeRoundi nt he callback further down.
                    Meteor.call('setChosenGameForRound', sub.meteorUserId, sub.treatment_now, sub.sec_now, sub.sec_rnd_now+1, q.choice, function(err, nextGameId) {
                        if (err) { throw( err ); }
                        if (nextGameId) {
                            Meteor.call('completeGameCompare', q._id, q.choice, nextGameId);
                        }
                    });
                });
            }

            

            // submit choices and do clean up on previousness
            qs.forEach( function( q ) {
                //console.log("inserting q", q);
                Meteor.call("insertQuestionToSubData", Meteor.userId(), q );
            });

            // also not affected by async
            //console.log("before q completion", sub);
            if ( sub.sec_rnd_now >= 1 ) { // don't match first two games or calculate their payoffs until feedback round 2
                //console.log("trying ocomplete questions");
                Meteor.call('tryToCompleteUncompletedQuestions', sub, design, function(err) {
                    /// calculate payoffs
                    if (design.playerOne) {
                        Meteor.call("updateExperimentEarnings", design.playerOne, design);
                        Meteor.call("updateStatusInHIT", design.playerOne, design);
                    } 
                    // ... and for the other player
                    if (design.playerTwo) {
                        Meteor.call("updateExperimentEarnings", design.playerTwo, design);
                        Meteor.call("updateStatusInHIT", design.playerTwo, design);
                    } else {
                        try {
                            console.assert( design.playerOne === muid, "Sanity check on updating of earnings" );
                        } catch (error) {
                            console.log( "Sanity check on updating of earnings", muid, design.playerOne, design, error );
                        }
                    }
                });
            }
            //console.log("after q completion 7");

            /////////////////////
            //// ... SEPARATELY, ADVANCE STATE 
            /////////////////////
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

Template.experimentInfo.helpers({
    choiceChecked: function ( ) {
        let sub = Sess.subStat();
        if (sub) {
            //console.log("experimentInfo.helpers", this, sub );
            let q = Questions.findOne({  meteorUserId : sub.meteorUserId, mtAssignmentId : sub.mtAssignmentId, sec: this.currentSection.id, sec_rnd : sub.sec_rnd_now });
            //console.log("experimentInfo.helpers", this, sub, q );
            if (UserElements.choiceChecked && !_.isNil(sub) && !_.isNil( q )) {
                return UserElements.choiceChecked.get( q._id );
            }
        }
    },
});

Template.questionBinary.events({
	'click div.expQuestion': function (e) {
        e.stopPropagation();
        //console.log("div.experimentQuestion out", this, e.target, e.currentTarget, e.target.getAttribute("choice"));
        if( $( e.target.firstElementChild ).hasClass( "disabled" ) || !$( e.target ).hasClass("btn")) return;// this is my disabled button test.  not sure why it works
        let questionData = this;
        if ( questionData.context.currentSection.type === "experiment" ) {
            let des = Sess.design();
            let choice = e.target.getAttribute("choice");
            let buttonId = e.currentTarget.id; // currentTarget is the div wrapper, target is each button within in
            //console.log("div.experimentQuestion", buttonId, choice, e.currentTarget.getAttribute("choice"), e.target.getAttribute("choice"));
            if ( !_.isNil( choice ) && e.currentTarget.getAttribute("choice") != choice ) {
                //console.log("div.experimentQuestion check", this, des, SubjectsData.find().fetch() );
                e.currentTarget.setAttribute( "choice", choice );
                UserElements.choiceChecked.set(buttonId, choice);
            } else { // uncheck
                //console.log("div.experimentQuestion uncheck");
                e.currentTarget.removeAttribute( "choice" );
                UserElements.choiceChecked.set(buttonId, "");
            }
        }
    },
});


Template.main.events({
    'click button.proceedButton#experiment1, click button.proceedButton#experiment2': function ( e ) {
        e.stopPropagation();
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("proceedButton#experiment", muid, sub, e.target );
        if ( sub.readyToProceed ) {
            /// advance section
            if (sub.sec_now === "experiment1" ) {
                Meteor.call('advanceSubjectSection', Meteor.userId(), "experiment2", "experiment", asyncCallback=function(err, updatedSub) {
                    if (err) { throw( err ); }
                    Meteor.call('initializeSection', sub=updatedSub, lastDesign=Sess.design());
                });
            } else if (sub.sec_now === "experiment2" ) {
                if (!sub.isExperienced) {
                    Meteor.call("addSectionQuestions", sub, "survey", Sess.design() );
                }
                Meteor.call('advanceSubjectSection', Meteor.userId(), "survey", "experiment");
            } else {
            }

            // complete cohort
            Meteor.call('tryToCompleteCohort', sub.cohort_now, function(err, cohortCompleted) {
                if (err) { throw( err ); }
                if (cohortCompleted) {
                    //console.log("COHORTcOMPLETED");
                }
            });
            // adjust screen 
            //Helper.windowAdjust(sub );
        } else {
        }
    },
});
