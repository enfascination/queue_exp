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
    //console.log("getPayoff", payoffs, loc, ret);
    return(ret);
};

Template.instPrefInstructions.helpers({
    aQuestion : function() {
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
        //console.log("textGameFeedbackStrategy", Template.currentData(), this);
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
    textGamePayoffs : function( payoffs, lOrR, tOrB, yOrO) {
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
        return( getPayoff( payoffs, rVal));
    },
	disabled: Helper.gameDisabled,
    insertChoice : function( outputType, choiceType, choice ) {
        /// WARNING.  this pretends it works for choice but it only works for active because there's a bug if i make it work for choice that i don't need to figure out to get what I want, which is feeding of db choice through to disabled game if it exists
        let q = this.question;
        let output = outputType === 'active' ? ' active' : ' choice="'+q.choice+'"';
        //console.log("insertChoice", ( q.type === choiceType && !_.isNil(q.choice) && q.choice === choice ), outputType, choiceType, choice, output, q);
        if (q.disabled && outputType === 'active' && q.type === choiceType && !_.isNil(q.choice) && q.choice === choice ) {
            return(output);
        }
    }
});
Template.gameVisualText.inheritsHelpersFrom('gameNormalForm');
Template.gameNormalFormGame.inheritsHelpersFrom('gameNormalForm');
Template.gameNormalFormGame.events({
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
        if (c.hasClass("chooseGame")) {
            choiceStrategyEl = c;
        }
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
            } else if (c.hasClass("chooseStrategyTop")) {
                // this is because cells aren't children of their colgroup
                //c.find('tr').children().removeClass("colhover");
                c.find('tr').children(':nth-child('+(colIndex+1)+')' ).addClass("colhover");
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
            } if (c.hasClass("chooseStrategyTop")) {
                    c.find('tr').children(':nth-child('+(colIndex+1)+')' ).removeClass("colhover");
                }
        }
        else if (e.type == 'click' && !c.hasClass('noactive') ) {
            if ( UserElements.choiceChecked.get( gameId+"_strategy" ) != choiceStrategy ) {
                let otherActives = c.find(".expChoice.active");
                if (c.hasClass("chooseGame")) {
                    otherActives = choiceStrategyEl.parents('table').find(".expChoice.active");
                }
                otherActives.removeClass("active").removeAttr("choice").attr("aria-pressed", false);
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
	disabled: Helper.questionDisabled ,
});
Template.questionGameCompare.inheritsHelpersFrom('questionGame');
Template.questionGameCompare.inheritsEventsFrom('questionGame');

Template.visualGame.helpers({
    getPayoff : getPayoff,
});
Template.instPrefGame2.helpers({
	questionsFeedback : function(){
        let sub = Sess.subStat();
        let dataContext = this;
        if (sub && dataContext.currentSection && this.questionsColl) {
            let questionsFeedback = Questions.find({meteorUserId : sub.meteorUserId, type : "chooseStrategy", sec_rnd : {$lt : 2}, sec : sub.sec_now}).fetch();
            _.forEach( questionsFeedback, function( q ) {
                console.log("feedback qusetions per q", q);
            });
            return(  questionsFeedback );
        }
    },
});

// for demoing
Template.questionGameCompareReshuffle.inheritsHelpersFrom('questionGame');
Template.questionGameCompareReshuffle.inheritsEventsFrom('questionGame');

let aGame = Helper.generateGame();
Template.questionGameCompareReshuffle.helpers({
    payoffsGame1Regenerator : function() {
        console.log("new game is", aGame);
        return( aGame );
    },
    payoffsGame2Regenerator : function() {
        return( Helper.tweakGame( aGame, switchOnly=true ) );
    },
});
