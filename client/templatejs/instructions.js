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
        //console.log("button#proceedButton#quiz", sub);
        if ( sub && sub.readyToProceed ) {
            Meteor.call("advanceSubjectSection", muid, "experiment1", "experiment", asyncCallback=function(err, updatedSub) {
                if (err) { throw( err ); }
                Meteor.call('initializeSection', sub=updatedSub, lastDesign=Sess.design());
            });
            // Meteor.call('goToExitSurvey', Meteor.userId()); redundant

            Helper.windowAdjust(sub );
        }
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
            if (sub.isExperienced) {
            stage = 4;
            } else {
            stage = 2;
            }
        }

        if (stage < 1) { stage = 1; }
        if (stage === 2) {
            Session.set('tutorialEnabled', true);
            Session.set('_tutorial_step_myCoolTutorial', 0);
            Router.go('start', {stage:stage});
        }
        if (stage >= 3) { stage = 3; }

                //let design = Design;
                //console.log("navButton", stage, Session.get('tutorialEnabled') , !_.isNil( design ), design.tutorialEnabled, ">>>" , Session.get('tutorialEnabled'), "<<<", !_.isNil( design ) && design.tutorialEnabled && Session.get('tutorialEnabled') );
        Helper.windowAdjust( );
    },
});
Template.instructions1.inheritsEventsFrom('navButton');
