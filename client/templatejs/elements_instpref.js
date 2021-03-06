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
    } else if (loc === 'obl') { ret = payoffs[5];
    } else if (loc === 'otr') { ret = payoffs[6];
    } else if (loc === 'obr') { ret = payoffs[7];
    }
    //console.log("getPayoff", payoffs, loc, ret);
    return(ret);
};

Template.instPrefInstructions.helpers({
    aQuestion : function() {
        let q = {};
        //q.payoffs = [1,-1,2,0,1,-1,2,0];
        q.payoffs = [2,0,3,1,2,0,3,1];
        //q.payoffs = [3,1,4,2,3,1,4,2];
        return(q);
    },
});
Template.instructions1.inheritsHelpersFrom('instPrefInstructions');
Template.instructions2.inheritsHelpersFrom('instPrefInstructions');
Template.instructions3.inheritsHelpersFrom('instPrefInstructions');
Template.instructions4.inheritsHelpersFrom('instPrefInstructions');
Template.instructions5.inheritsHelpersFrom('instPrefInstructions');
Template.instructions6.inheritsHelpersFrom('instPrefInstructions');
Template.instructions7.inheritsHelpersFrom('instPrefInstructions');
Template.instructions8.inheritsHelpersFrom('instPrefInstructions');

Template.main.onCreated( function(){
    // makes visualtext meaningful during hover, 
    //   also does other things
    UserElements.choiceConsidered = new ReactiveDict(); 
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
    insertChoice : function( outputType, choiceTypeElement, choiceTypeQuestion, choiceElement, choiceQuestion ) {
        /// WARNING.  this pretends it works for choice but it only works for active because there's a bug if i make it work for choice that i don't need to figure out to get what I want, which is feeding of db choice through to disabled game if it exists
        let q = this.question;
        let output = outputType === 'active' ? ' active' : ' choice="'+q.choice+'"';
        //console.log("insertChoice", ( choiceTypeQuestion === choiceTypeElement && !_.isNil(q.choice) && q.choice === choiceElement ), outputType, choiceTypeElement, choiceTypeQuestion, q.choice, choiceElement, output, q);
        if (q.disabled && outputType === 'active' && choiceTypeQuestion === choiceTypeElement && !_.isNil(q.choice) && q.choice === choiceElement ) {
            return(output);
        }
    }
});
Template.gameVisualText.inheritsHelpersFrom('gameNormalForm');
Template.gameNormalFormChoiceFeedback.inheritsHelpersFrom('gameNormalForm');
Template.gameNormalFormOutcomeFeedback.inheritsHelpersFrom('gameNormalForm');
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
        //// get choiceSTrategy out of limbo when it's over game table border (and not over a choice)
        if ( _.isNil( choiceStrategy ) ) { choiceStrategy = '';}
        //if ( _.isNil( choiceStrategyEl ) ) { return;}
        //https://css-tricks.com/row-and-column-highlighting/
        if (e.type == 'mouseover') {
            choiceStrategyEl.addClass("hover"); //self is tr
            // RE: this next if(), hover can be true even 
            //    when choicestrategy is 
            //    empty, if you are hovering over non-game 
            //    parts of the table, like the border.  in 
            //    such a case, don't imply that hover is true
            //    (choiceStrategy is undefined when it's in this limbo and "" otherwise
            if (  _.isNil( choiceStrategy ) || choiceStrategy.length > 0) {  
                UserElements.choiceConsidered.set( gameId, true );
                UserElements.choiceConsidered.set( gameId+"_strategy", choiceStrategy );
            }
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
            //console.log('mouseout', UserElements.choiceConsidered.get(gameId+"_strategy"));
            choiceStrategyEl.removeClass("hover"); //self is tr
            UserElements.choiceConsidered.set( gameId, false );
            UserElements.choiceConsidered.set( gameId+"_strategy", '' );
            if ( c.hasClass( "chooseOutcome" ) && choiceStrategyEl.hasClass( "gameNormalFormOutcome" )) {
                parentTr.removeClass("hover");
                parentCol.removeClass("hover");
            } else if (c.hasClass("chooseStrategyTop")) {
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
                UserElements.choiceChecked.set( gameId+"_choiceMadeTime", Date.now() );
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
Template.gameComparison.inheritsHelpersFrom('questionGame');

Template.visualGame.helpers({
    getPayoff : getPayoff,
});
Template.instPrefGame2.helpers({
	questionsFeedback : function( allQs = false ){
        let questionsFeedback, sub = Sess.subStat();
        let dataContext = this;
        if (sub && dataContext.currentSection && this.questionsColl) {
            /// in which context am I giving feedback (within section or within HIT)?
            if (allQs) {
                questionsFeedback = Questions.find({meteorUserId : sub.meteorUserId, mtAssignmentId : sub.mtAssignmentId,  sec : { $in : ['experiment1', 'experiment2']}, choice : { $ne : null } });
            } else {
                questionsFeedback = Questions.find({meteorUserId : sub.meteorUserId, mtAssignmentId : sub.mtAssignmentId, sec : sub.sec_now , choice : {$ne : null }});
            }
            // pick which questions ot display, and enrich them a bit for the HIT feedback context
            questionsFeedback = questionsFeedback.map( function( q ) {
                let r = false;
                if (q.type === "chooseStrategy" && q.paid ) {
                    r = true;
                    if (q.completedGame) {
                        q.choice = q.outcome;  // temporarily overwrite for display pursposes
                    }
                } else if ( q.type === "chooseGame" ){
                    r = true;
                }
                //console.log("feedback questions per q", r, q.type, q);
                q.display = r;
                return(q);
            });
            return(  _.filter( questionsFeedback, (q)=>q.display ) );
        }
    },
});
Template.earningsReport.inheritsHelpersFrom('instPrefGame2');

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
        let rGame = Helper.pivotGame( aGame);
        console.log("nwr game is", rGame);
        console.log("nwp game is", Helper.pivotGame( rGame));
        return( rGame );
    },
});
