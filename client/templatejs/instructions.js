/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { Router } from 'meteor/iron:router';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';

Template.main.events({
    'click button.proceedButton#instructions, click button.proceedButton#quiz': function ( e ) {
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button#proceedButton#instructions and quiz", sub, Template.currentData());
        Helper.activateTab( Template.currentData().currentSection.id );
        Helper.windowAdjust(sub );
    }
});
Template.navButton.events({
    "click button.navButton" : function( e ) {
        let stage = _.toInteger( e.target.value );
        //console.log("navButton", stage, e.target.value, this, e.target);
        if (stage < 1) { stage = 1; }
        if (stage === 2) {
            Session.set('tutorialEnabled', true);
        }
        if (stage >= 7) { stage = 7; }
        Helper.activateTab( 'quiz' );
        Router.go('start', {stage:stage});
    },
});
