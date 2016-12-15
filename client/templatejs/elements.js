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
        Helper.activateTab( val );
    },
});
Template.navButton.helpers({
    targetSection : function() {
        //console.log( "targetSection", this );
        if ( this.currentTab === this.currentSection.id ) {
            if (this.currentSection.id === 'instructions') {
                return(DesignSequence.quiz);
            } else {
                return(DesignSequence.instructions);
            }
        } else {
            return( this.currentSection );
        }
    },
});
Template.submitButton.helpers({
	disabled: function( ){
        let sub = Sess.subStat();
        if( sub && sub.readyToProceed ) {
            return("disabled");
        }
	},
});
Template.proceedButton.helpers({
	disabled: function( ){
        let sub = Sess.subStat();
        if( sub && sub.readyToProceed ) {
        } else {
            return("disabled");
        }
	},
});
Template.proceedButton.events({
});

Template.binaryForcedChoice.helpers({
	disabled: function( id ){
        let sub = Sess.subStat();
        if( Questions.findOne( { _id : id } ).disabled || (sub && sub.readyToProceed ) ) {
            return("disabled");
        }
	},
});

Template.binaryForcedChoice.events({
    'click button.expChoice': function (e) {
        //console.log("div.expChoices", e.target);
        if (!$( e.target ).hasClass("disabled")) {
            if ( e.target.hasAttribute( "checked" ) ) { //if button already checked
                e.target.parentElement.removeAttribute( "choice" );
            } else {
                e.target.parentElement.setAttribute( "choice", e.target.getAttribute("choice") );
            }
            for (let child of e.target.parentElement.children) {
                if ( e.target.getAttribute("choice") === child.getAttribute("choice") && !child.hasAttribute("checked")) {
                    child.setAttribute("checked", '');
                } 
                else {// uncheck a checked button
                    child.removeAttribute("checked");
                }
            }
        } else {
            e.stopPropagation();
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

