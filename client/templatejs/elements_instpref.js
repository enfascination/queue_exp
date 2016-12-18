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
        //console.log( lOrR, tOrB, yOrO);
        let rVal = "__";
               if (lOrR === "Right" && tOrB === "Top"    && yOrO === "You"   ) { rVal = 1;
        } else if (lOrR === "Right" && tOrB === "Top"    && yOrO === "Other" ) { rVal = 4;
        } else if (lOrR === "Right" && tOrB === "Bottom" && yOrO === "You"   ) { rVal = 2;
        } else if (lOrR === "Right" && tOrB === "Bottom" && yOrO === "Other" ) { rVal = 2;
        } else if (lOrR === "Left"  && tOrB === "Top"    && yOrO === "You"   ) { rVal = 3;
        } else if (lOrR === "Left"  && tOrB === "Top"    && yOrO === "Other" ) { rVal = 3;
        } else if (lOrR === "Left"  && tOrB === "Bottom" && yOrO === "You"   ) { rVal = 4;
        } else if (lOrR === "Left"  && tOrB === "Bottom" && yOrO === "Other" ) { rVal = 1;
        }
        return( rVal );
    },
	disabled: Helper.questionDisabled,
});

Template.gameNormalForm.events({
	'click .gameNormalFormGame, mouseover .gameNormalFormGame, mouseout .gameNormalFormGame': function (e) { /// GUI and UX elements for the "choose element" versionof the question
        let c = $( e.currentTarget ); //the button
        let gameId = c.attr('id'); //self is the table
        let parentCol;
        {
            let cell = $( e.target ).closest('th,td');
            let colIndex =  cell.parent().children().index( cell) ;
            parentCol = c.find("colgroup").eq( colIndex );
        }
        let choiceStrategy;
        //c.find("colgroup.gameNormalFormChoice").eq( choiceStrategyEl.parent().index() ).addClass("hover");
        if (!c.hasClass("chooseStrategyTop")) {
            choiceStrategy = $(e.target).closest(".expChoice").attr('data-value');
        } else {
            choiceStrategy = parentCol.attr("data-value");
        }
        let choiceStrategyEl = c.find('.expChoice[data-value="'+choiceStrategy+'"]');
        let parentTr = choiceStrategyEl.closest('tr.gameNormalFormChoice' );
        //console.log("choosestrategy", gameId, choiceStrategy, c.hasClass( "chooseOutcome" ), choiceStrategyEl[0], colIndex);
        //UserElements.choiceConsidered.set( "game", c.attr('id');
        //https://css-tricks.com/row-and-column-highlighting/
        if (e.type == 'mouseover') {
            choiceStrategyEl.addClass("hover"); //self is tr
            UserElements.choiceConsidered.set( gameId, true );
            UserElements.choiceConsidered.set( gameId+"_strategy", choiceStrategy );
            if ( c.hasClass( "chooseOutcome" ) && choiceStrategyEl.hasClass( "gameNormalFormOutcome" )) {
                parentTr.addClass("hover");
                parentCol.addClass("hover");
            }
            // this is a hack to get the helper updating
            if ( _.isNil( UserElements.choiceChecked.get( gameId ) ) ) {
                UserElements.choiceChecked.set( gameId, false );
            }
        }
        else if (e.type == 'mouseout') {
            choiceStrategyEl.removeClass("hover"); //self is tr
            UserElements.choiceConsidered.set( gameId, false );
            UserElements.choiceConsidered.set( gameId+"_strategy", '' );
            if ( c.hasClass( "chooseOutcome" ) && choiceStrategyEl.hasClass( "gameNormalFormOutcome" )) {
                parentTr.removeClass("hover");
                parentCol.removeClass("hover");
            }
        }
        else if (e.type == 'click' && !c.hasClass('noactive') ) {
            if ( UserElements.choiceChecked.get( gameId+"_strategy" ) != choiceStrategy ) {
                c.find(".expChoice.active").removeClass("active").removeAttr("choice").attr("aria-pressed", false);
                choiceStrategyEl.addClass("active"); //self is tr
                choiceStrategyEl.attr("choice", choiceStrategy); // for data handling within form
                UserElements.choiceChecked.set( gameId, true );
                UserElements.choiceChecked.set( gameId+"_strategy", choiceStrategy );
            } else {
                choiceStrategyEl.removeClass("active"); 
                choiceStrategyEl.removeAttr("choice"); 
                UserElements.choiceChecked.set( gameId, false );
                UserElements.choiceChecked.set( gameId+"_strategy", '' );
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
	disabled: Helper.questionDisabled,
});
