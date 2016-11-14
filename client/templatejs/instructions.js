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
        if (Sess.subData() && Sess.subData().theData) {
            return Sess.subData()[0].theData.queuePosition || "XXX";
        }
    },
    earningsAMin: function () {
        let sub = Sess.subData();
        let aDesign = Sess.design();
        if ( sub && sub.theData ) {
            let qPos = sub.theData[0].queuePosition * aDesign.positionCosts;
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
            let qPos = sub.theData[0].queuePosition * aDesign.positionCosts;
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
