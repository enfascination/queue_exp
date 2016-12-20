/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';

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
let navDisabled = function( ){
        let sub = Sess.subStat();
        if( sub && sub.readyToProceed ) {
            return(true);
        } else {
            return(false);
        }
	};
Template.submitButton.helpers({
	disabled: function() {
        return( navDisabled() ? "disabled" : null );
    }
});
Template.proceedButton.helpers({
	disabled: function() {
        return( navDisabled() ? null : "disabled" );
    }
});
Template.proceedButton.events({
});

let expChoiceHandler = function (e) {
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
    }; 

Template.answersForm.onCreated( function() {
    UserElements.questionsIncomplete = new ReactiveVar(false);
});
Template.answersForm.helpers({
	questions: function(){
        let shuffled;
        let sub = Sess.subStat();
        let dataContext = this;
        if (false && dataContext.currentSection.shuffledQuestions) {
            shuffled = true;// namely in the quiz
        } else { 
            shuffled = false;
        }
        if (dataContext.currentSection && this.questionsColl) {
            console.log("elements questions", this.questionsColl.fetch());
            return( Helper.questions( this.questionsColl, sub, dataContext.currentSection.id, dataContext, shuffled) );
        }
    },
});

Template.questionBinary.events({
    'click .expChoice': expChoiceHandler,
});
Template.questionBinary.helpers({
	getHasError: Helper.getHasError,
	disabled: Helper.questionDisabled,
	//disabled: function(id) { console.log("inhere", Template.currentData() ); return(Helper.questionDisabled(id));},
});
Template.questionQuad.helpers({
	options: function() {
        let dataContext = this;
        return( _.map( dataContext.options ,  (e)=> {return({"name" : e, "id" : dataContext._id , "disabled" : dataContext.disabled });} ));
    },
});
Template.questionQuad.inheritsHelpersFrom('questionBinary');
Template.questionQuad.inheritsEventsFrom('questionBinary');
Template.questionDropdown.inheritsHelpersFrom('questionQuad');
Template.questionDropdown.inheritsEventsFrom('questionQuad');
Template.questionText.inheritsHelpersFrom('questionBinary');
Template.questionText.inheritsEventsFrom('questionBinary');

