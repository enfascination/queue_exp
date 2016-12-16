/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';
import { Questions } from '../../imports/startup/experiment_prep_instpref.js';

Template.gameNormalForm.onCreated( function(){
    UserElements.choiceConsidered = new ReactiveDict();
});
Template.gameNormalForm.onCreated( function(){
});
Template.gameNormalForm.helpers({
    textGameFeedback : function( feedbackType) {
        let gameId = Template.currentData().gameId;
        let feedbackId = gameId + "_" + feedbackType;
        let rVal = "default";
        //console.log("feedback", feedbackType, gameId, UserElements.choiceConsidered.get( gameId ), UserElements.choiceChecked.get( gameId ) );
        if ( !_.isNil( UserElements.choiceConsidered ) && UserElements.choiceConsidered.get( gameId ) ) {
            rVal = UserElements.choiceConsidered.get( feedbackId );
        } else if ( !_.isNil( UserElements.choiceChecked ) && UserElements.choiceChecked.get( gameId ) ) {
            rVal =  UserElements.choiceChecked.get( feedbackId );
        }
        return( rVal );
    },
    textGameFeedbackStrategy : function() {
        let gameId = Template.currentData().gameId;
        let feedbackId = gameId + "_" + "strategy";
        let rVal = "___";
        if ( !_.isNil( UserElements.choiceConsidered ) && UserElements.choiceConsidered.get( gameId ) ) {
            rVal = UserElements.choiceConsidered.get( feedbackId );
        } else if ( !_.isNil( UserElements.choiceChecked ) && UserElements.choiceChecked.get( gameId ) ) {
            rVal =  UserElements.choiceChecked.get( feedbackId );
        }
        return( rVal );
    },
    textGamePayoffs : function( lOrR, tOrB, yOrO) {
        let rVal = "__";
               if (lOrR === "right" && tOrB === "top"    && yOrO === "you"   ) { rVal = 1;
        } else if (lOrR === "right" && tOrB === "top"    && yOrO === "other" ) { rVal = 4;
        } else if (lOrR === "right" && tOrB === "bottom" && yOrO === "you"   ) { rVal = 2;
        } else if (lOrR === "right" && tOrB === "bottom" && yOrO === "other" ) { rVal = 2;
        } else if (lOrR === "left"  && tOrB === "top"    && yOrO === "you"   ) { rVal = 3;
        } else if (lOrR === "left"  && tOrB === "top"    && yOrO === "other" ) { rVal = 3;
        } else if (lOrR === "left"  && tOrB === "bottom" && yOrO === "you"   ) { rVal = 4;
        } else if (lOrR === "left"  && tOrB === "bottom" && yOrO === "other" ) { rVal = 1;
        }
        return( rVal );
    },
});

Template.gameNormalForm.events({
	'click .chooseStrategy .gameNormalFormChoice, mouseover .chooseStrategy .gameNormalFormChoice, mouseout .chooseStrategy .gameNormalFormChoice': function (e) { /// GUI and UX elements for the "choose element" versionof the question
        let c = $( e.currentTarget ); //the button
        let choiceStrategy = c.attr('data-strategy');
        let choiceOutcome = "none";
        let choicePayoff = "none";
        let gameId = c.parent().parent().attr('id'); //grandparent is the table
        //console.log("choosestrategy", gameId);
        //UserElements.choiceConsidered.set( "game", c.attr('id');
        //https://css-tricks.com/row-and-column-highlighting/
        if (e.type == 'mouseover') {
            c.addClass("hover"); //self is tr
            UserElements.choiceConsidered.set( gameId, true );
            UserElements.choiceConsidered.set( gameId+"_strategy", choiceStrategy );
            // this is a hack to get the helper updating
            if ( _.isNil( UserElements.choiceChecked.get( gameId ) ) ) {
                UserElements.choiceChecked.set( gameId, false );
            }
        }
        else if (e.type == 'mouseout') {
            c.removeClass("hover"); //self is tr
            UserElements.choiceConsidered.set( gameId, false );
            UserElements.choiceConsidered.set( gameId+"_strategy", '' );
        }
        else if (e.type == 'click') {
            if ( UserElements.choiceChecked.get( gameId+"_strategy" ) != choiceStrategy ) {
                c.parent().find(".gameNormalFormChoice.active").removeClass("active").removeAttr("choice").attr("aria-pressed", false);
                c.addClass("active"); // for ux
                c.attr("choice", choiceStrategy); // for data handling within form
                UserElements.choiceChecked.set( gameId, true );
                UserElements.choiceChecked.set( gameId+"_strategy", choiceStrategy );
            } else {
                c.removeClass("active"); 
                c.removeAttr("choice"); 
                UserElements.choiceChecked.set( gameId, false );
                UserElements.choiceChecked.set( gameId+"_strategy", '' );
            }
        }
    },
	'click .chooseOutcome button.gameNormalFormOutcome, mouseover .chooseOutcome button.gameNormalFormOutcome, mouseout .chooseOutcome button.gameNormalFormOutcome': function (e) { /// GUI and UX elements for the "choose element" versionof the question
        let c = $( e.currentTarget ); //the button
        let choiceStrategy = c.attr('data-strategy');
        let choiceOutcome = c.attr('data-outcome');
        let choicePayoff = c.find('g:hover').attr("data-value");
        let gameId = c.attr('id');
        //UserElements.choiceConsidered.set( "game", c.attr('id');
        //https://css-tricks.com/row-and-column-highlighting/
            //console.log("mouseover chooseoutcome", e.type, gameId, UserElements.choiceConsidered.get( gameId ), UserElements.choiceChecked.get( gameId ));
        if (e.type === 'mouseover') {
            c.addClass("hover"); //self is button
            c.parent().parent().addClass("hover"); // parent is tr
            $("table#"+gameId+" "+"colgroup").eq( c.parent().index() ).addClass("hover");
            UserElements.choiceConsidered.set( gameId, true );
            UserElements.choiceConsidered.set( gameId+"_strategy", choiceStrategy );
            UserElements.choiceConsidered.set( gameId+"_outcome", choiceOutcome );
            UserElements.choiceConsidered.set( gameId+"_payoff", choicePayoff );
            // this is a hack to get the helper updating
            if ( _.isNil( UserElements.choiceChecked.get( gameId ) ) ) {
                UserElements.choiceChecked.set( gameId, false );
            }
        }
        else if (e.type === 'mouseout') {
            c.removeClass("hover"); //self is button
            c.parent().parent().removeClass("hover"); // parent is td, grandparent is tr
            $("table#"+gameId+" "+"colgroup").eq( c.parent().index() ).removeClass("hover");
            UserElements.choiceConsidered.set( gameId, false );
            UserElements.choiceConsidered.set( gameId+"_strategy", '' );
            UserElements.choiceConsidered.set( gameId+"_outcome", '' );
            UserElements.choiceConsidered.set( gameId+"_payoff", '' );
        }
        else if (e.type === 'click') {
            //console.log("outcome click", gameId, choiceStrategy, choiceOutcome, UserElements.choiceChecked.get( gameId+"_outcome" ) );
            if ( UserElements.choiceChecked.get( gameId+"_outcome" ) != choiceOutcome ) {
                $(".gameNormalFormGame").find(".gameNormalFormOutcome.active").removeClass("active").removeAttr("choice").attr("aria-pressed", false);
                c.addClass("active"); // parent is tr
                c.attr("choice", choiceOutcome); // for data handling within form
                UserElements.choiceChecked.set( gameId, true );
                UserElements.choiceChecked.set( gameId+"_strategy", choiceStrategy );
                UserElements.choiceChecked.set( gameId+"_outcome", choiceOutcome );
                UserElements.choiceChecked.set( gameId+"_payoff", choicePayoff );
                //UserElements.choiceChecked.set( "game"+c.attr('data-outcome'), choiceOutcome );
            } else {
                c.removeClass("active"); 
                c.removeAttr("choice"); // for data handling within form
                UserElements.choiceChecked.set( gameId, false );
                UserElements.choiceChecked.set( gameId+"_strategy", '' );
                UserElements.choiceChecked.set( gameId+"_outcome", '' );
                UserElements.choiceChecked.set( gameId+"_payoff", '' );
            }
        }
    },
});
Template.questionGame.events({
	'click div.expQuestion': function (e) {
        e.stopPropagation();
        let oQ = $( e.currentTarget);// the question obj in the form
        //let oBtn = $( e.target); BAD IDEA, TRY BETTER BELOW because this gets polygons and everything.// the element that got clicked
        let oBtn = oQ.find(".expChoice.active#"+e.currentTarget.id);
        //console.log("expQuestion for games", oBtn[0] );
        if ( oBtn && oBtn.attr( "choice" ) ) {
            oQ.attr( "choice", oBtn.attr("choice") );
        } else {
            oQ.removeAttr( "choice" );
        }
    },
});
Template.questionGame.helpers({
	getHasError: Helper.getHasError,
});
