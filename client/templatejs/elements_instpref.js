/*jshint esversion: 6 */
var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TurkServer } from 'meteor/mizzao:turkserver';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Helper } from '../../imports/lib/helper.js';
import { Sess } from '../../imports/lib/quick-session.js';

let getPayoff = function(payoffs, loc) {
    if (_.isNil(payoffs) ) return;
    let ret;
           if (loc === 'ytl') { ret = payoffs[0];
    } else if (loc === 'ytr') { ret = payoffs[1];
    } else if (loc === 'ybl') { ret = payoffs[2];
    } else if (loc === 'ybr') { ret = payoffs[3];
    } else if (loc === 'otl') { ret = payoffs[4];
    } else if (loc === 'otr') { ret = payoffs[5];
    } else if (loc === 'obl') { ret = payoffs[6];
    } else if (loc === 'obr') { ret = payoffs[7];
    }
    return(ret);
};

Template.instPrefInstructions.helpers({
    question : function() {
        let q = {};
        q.payoffs = [3,1,4,2,3,4,1,2];
        return(q);
    },
});
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
        if (_.isNil(this.question)) return;
        //console.log( lOrR, tOrB, yOrO, this);
        let rVal = "__";
               if (lOrR === "Right" && tOrB === "Top"    && yOrO === "You"   ) { rVal = 'ytr';
        } else if (lOrR === "Right" && tOrB === "Top"    && yOrO === "Other" ) { rVal = 'otr';
        } else if (lOrR === "Right" && tOrB === "Bottom" && yOrO === "You"   ) { rVal = 'ybr';
        } else if (lOrR === "Right" && tOrB === "Bottom" && yOrO === "Other" ) { rVal = 'obr';
        } else if (lOrR === "Left"  && tOrB === "Top"    && yOrO === "You"   ) { rVal = 'ytl';
        } else if (lOrR === "Left"  && tOrB === "Top"    && yOrO === "Other" ) { rVal = 'otl';
        } else if (lOrR === "Left"  && tOrB === "Bottom" && yOrO === "You"   ) { rVal = 'ybl';
        } else if (lOrR === "Left"  && tOrB === "Bottom" && yOrO === "Other" ) { rVal = 'obl';
        }
        let payoffs = this.question.payoffs;
        return( getPayoff(payoffs, rVal));
    },
	disabled: Helper.questionDisabled,
    'ytl' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'ytl'),
    'ytr' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'ytr'),
    'ybl' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'ybl'),
    'ybr' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'ybr'),
    'otl' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'otl'),
    'otr' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'otr'),
    'obl' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'obl'),
    'obr' : ()=>Template.currentData().question && getPayoff(Template.currentData().question.payoffs, 'obr'),
});

Template.gameNormalForm.events({
	'click .gameNormalFormGame, mouseover .gameNormalFormGame, mouseout .gameNormalFormGame': function (e) { /// GUI and UX elements for the "choose element" versionof the question
        let c = $( e.currentTarget ); //c is the table
        let gameId = c.attr('id'); 
        let cell = $( e.target ).closest('th,td');
        let colIndex =  cell.parent().children().index( cell) ;
        let parentCol = c.find("colgroup").eq( colIndex );
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
                if (c.hasClass("chooseStrategyTop")) {
                    // this is because cells aren't children of their colgroup
                    c.find('tr').children().removeClass("colactive");
                    c.find('tr').children(':nth-child('+(colIndex+1)+')' ).addClass("colactive");
                }
            } else {
                choiceStrategyEl.removeClass("active"); 
                choiceStrategyEl.removeAttr("choice"); 
                UserElements.choiceChecked.set( gameId, false );
                UserElements.choiceChecked.set( gameId+"_strategy", '' );
                if (c.hasClass("chooseStrategyTop")) {
                    c.find('tr').children(':nth-child('+(colIndex+1)+')' ).removeClass("colactive");
                }
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
            
