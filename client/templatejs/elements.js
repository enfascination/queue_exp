/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep.js';

Template.navButton.events({
    "click button.navButton" : function( e ) {
        let val = e.target.value;
        //console.log("click button.navButton after",_.join( [ '.nav-tabs a[href="#', val, '"]' ], '' ));
        $( _.join( [ '.nav-tabs a[href="#', val, '"]' ], '' ) ).tab('show');
    },
});
Template.proceedButton.helpers({
});
Template.proceedButton.events({
});

Template.binaryForcedChoice.helpers({
	disabled: function( id ){
        if( Questions.findOne( { _id : id } ).disabled || (Sess.subStat() && Sess.subStat().readyToProceed ) ) {
            return("disabled");
        }
	},
});

Template.binaryForcedChoice.events({
	'click button.expChoice': function (e) {
        //console.log("button.expChoice");
    },
	'click div.expChoices': function (e) {
        //console.log("div.expChoices");
        if ( e.target.hasAttribute( "checked" ) ) {
            e.currentTarget.removeAttribute( "choice" );
        } else {
            e.currentTarget.setAttribute( "choice", e.target.getAttribute("choice") );
        }
        for (let child of e.currentTarget.children) {
            if (!$( child ).hasClass("disabled")) {
                if ( e.target.getAttribute("choice") === child.getAttribute("choice") && !child.hasAttribute("checked")) {
                    child.setAttribute("checked", '');
                } 
                else {// uncheck a checked button
                    child.removeAttribute("checked");
                }
            }
        }
	}, 
});
Template.questionBinary.helpers({
	hasError: function( id ){
        if (Questions.findOne( id ).hasError ) {
            return("has-error");
        }
	},
});

