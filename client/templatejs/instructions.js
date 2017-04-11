/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Router } from 'meteor/iron:router';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';

Template.main.events({
    //'click button.proceedButton#instructions, click button.proceedButton#quiz': function ( e ) {
        //let muid = Meteor.userId();
        //let sub = Sess.subStat();
        ////console.log("button#proceedButton#instructions and quiz", sub, Template.currentData());
        //Helper.activateTab( Template.currentData().currentSection.id );
        //Helper.windowAdjust(sub );
    //}
    'click button.proceedButton#instructions': function ( e ) {
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button#proceedButton#instructions", sub);
        if ( sub && sub.readyToProceed ) {
            Meteor.call("advanceSubjectSection", muid, "experiment1", "experiment", asyncCallback=function(err, updatedSub) {
                if (err) { throw( err ); }
                Meteor.call('initializeSection', sub=updatedSub, lastDesign=Sess.design());
            });
            // Meteor.call('goToExitSurvey', Meteor.userId()); redundant

        }
        //Helper.windowAdjust(sub, bottom=false );
        //window.scrollTo(0, 0);
    },
});
Template.navButton.events({
    "click button.navButton" : function( e ) {
        let stage = _.toInteger( e.target.value );
        let sub = SubjectsStatus.findOne({meteorUserId : Meteor.userId() });
        let design = Design;
        //console.log("navButton", stage, e.target.value, this, e.target);
        if (e.target.id === "NoConsent" || sub.isExperienced >= design.maxExperimentReps) {
            Meteor.call("advanceSubjectSection", Meteor.userId(), "submitHIT",  "submitHIT" );
        } else if (e.target.id === "Consent") {
            if (sub.isExperienced || Debugging) {
                stage = 3;
                Meteor.call( "setReadyToProceed", Meteor.userId());
            } else {
                stage = 2;
            }
        }

        if (stage < 1) { stage = 1; }
        if (stage === 2) {
            if (design.tutorialEnabled) {
                Session.set('tutorialEnabled', true);
                Session.set('_tutorial_step_myCoolTutorial', 0);
            } else {
                Meteor.call("advanceSubjectSection", Meteor.userId(), "quiz",  "quiz" );
            }
        } else if (stage >= 3) { 
            stage = 3; 
        }
        Router.go('start', {stage:stage});

        //let design = Design;
        //console.log("navButton", stage, Session.get('tutorialEnabled') , !_.isNil( design ), design.tutorialEnabled, ">>>" , Session.get('tutorialEnabled'), "<<<", !_.isNil( design ) && design.tutorialEnabled && Session.get('tutorialEnabled') );
        //Helper.windowAdjust(sub, bottom=false );
    },
});
Template.instructions1.inheritsEventsFrom('navButton');
