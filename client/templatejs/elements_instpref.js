/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep.js';

Template.gameNormalForm.onCreated( function(){
    UserElements.choiceConsidered = new ReactiveDict();
    UserElements.choiceConsidered.set("game", "");
    UserElements.choiceChecked.set("game", "");
});

Template.gameNormalForm.helpers({
	//disabled: function( id ){
        //let sub = Sess.subStat();
        //if( Questions.findOne( { _id : id } ).disabled || (sub && sub.readyToProceed ) ) {
            //return("disabled");
        //}
	//},
    gameChoice : function() {
        if ( UserElements.choiceConsidered ) {
            return( "consider: " + UserElements.choiceConsidered.get( "game" ) + "     chose: " + UserElements.choiceChecked.get( "game" ) );
        }
    },
});

Template.gameNormalForm.events({
	'mouseover .gameNormalFormOutcome': function (e) {
        let c = $( e.currentTarget );
        //console.log(c[0], c.find('g:hover')[0]);
        //UserElements.choiceConsidered.set( "game", c.attr('id');
        UserElements.choiceConsidered.set( "game", c.attr('id')+" "+c.find('g:hover').attr("data-value") );
    },
	'mouseout .gameNormalFormOutcome': function (e) {
        UserElements.choiceConsidered.set( "game", "" );
    },
	'click .gameNormalFormOutcome': function (e) {
        let c = $( e.currentTarget );
        let cVal;
        //cVal = c.attr('id')+" "+c.find('g:hover').attr("data-value");
        cVal = c.attr('id');
        if ( UserElements.choiceChecked.get("game") != cVal ) {
            UserElements.choiceChecked.set( "game",  cVal );
            //UserElements.choiceChecked.set( "game"+c.attr('id'), cVal );
        } else {
            UserElements.choiceChecked.set( "game", "" );
        }
    },
	'click button.expChoice': function (e) {
        //console.log("button.expChoice");
    },
	'click div.expChoices': function (e) {
        //console.log("div.expChoices");
        if ( e.target.hasAttribute( "checked" ) ) { //if button already checked
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
            } else {
                e.stopPropagation();
            }
        }
	}, 
});
