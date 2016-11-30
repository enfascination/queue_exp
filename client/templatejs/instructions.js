/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep.js';

Template.experimentInstructions.onCreated( function(){
});
Template.experimentInstructions.helpers({
    counterNet: function () {
        let sdata = Sess.subData();
        if( !_.isNil( sdata ) && !_.isNil( sdata[0] ) ) {
            return sdata[0].theData.queuePosition || "XXX";
        }
    },
    earningsAMin: function () {
        let subs = Sess.subData();
        let aDesign = Sess.design();
        if ( subs && aDesign && subs[0] && subs[0].theData ) {
            let sub = subs[0];
            let qPos = sub.theData.queuePosition * aDesign.positionCosts;
            return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 - qPos ) );
        }
    },
    earningsAMax: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.A + 1.00 ) );
        }
    },
    earningsBMin: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B ) );
        }
    },
    earningsBMax: function () {
        let subs = Sess.subData();
        let aDesign = Sess.design();
        if ( subs && aDesign && subs[0] && subs[0].theData ) {
            let sub = subs[0];
            let qPos = sub.theData.queuePosition * aDesign.positionCosts;
            return( Helper.toCash( aDesign.endowment - aDesign.queueCosts.B + 1.00 - qPos ) );
        }
    },
    groupSize: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( aDesign.maxPlayersInCohort || "XXX");
        }
    },
    positionCosts: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( Helper.toCash( aDesign.positionCosts ) );
        }
    },
    endowment: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( Helper.toCash( aDesign.endowment ) );
        }
    },
    pot: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return( Helper.toCash( aDesign.pot ) );
        }
    },
});
Template.main.events({
    'click button#exitInstructions': function ( e ) {
    //'click': function ( e ) {
        let muid = Meteor.userId();
        let sub = Sess.subStat();
        //console.log("button#exitInstructions", sub, Template.currentData());
        if (sub.sec_now === "instructions") {
            Meteor.call("advanceSubjectSection", muid, "quiz", "quiz");
        } else {
            Helper.activateTab( Template.currentData().currentSection.id );
        }
    }
});