/*jshint esversion: 6 */

var _ = require('lodash');
import { Sess } from './quick-session.js';

/// local used below
let makeTabDOMEl = function( tab ) {
    return(  _.join( [ ".expTabs a[data-target='#", tab, "']" ], '' ) );
};
let makeTabEl = function( tab ) {
    return(  $( _.join( [ ".expTabs a[data-target='#", tab, "']" ], '' ) )  );
};
let makeTabPaneEl = function( tab ) {
    return(  $( _.join( [ "div.tab-pane#", tab, "" ], '' ) )  );
};
let enableTab = function enableTab( tab ) {
    let el = makeTabEl( tab );
    //console.log("enabling", makeTabDOMEl( tab ));
    el.removeAttr('cursor');
    el.attr('data-toggle', 'tab');
    el.parent().removeClass('disabled');
    el.attr('href', "#"+tab );
    // also give active tabs updating events
    el.on("click", function(e) {
        //e.stopPropagation();
        //e.preventDefault();
        // if the tab gets clicked, activate it
        //activateTab( tab );
    });
};
let activateTab = function( tab ) {
    enableTab( tab );
    let el = makeTabEl( tab );
    //el.on("shown.bs.tab", function(e) {console.log("shown event", e.target);});
    el.tab();
    let ret = el.tab('show');
    //console.log("activateTab", ret.get(0));
    // kludge to set pane explicitly as well as tab itself
    let tabPaneEl = makeTabPaneEl( tab );
    //tabPaneEl.addClass('active');
    //tabEl.attr('aria-expanded', 'false');

};
let disableTab = function( tab ) {
    //console.log(el.attr('cursor'), el.attr('data.toggle'), el.attr('href'), el.id );
    let el = makeTabEl( tab );
    el.attr('cursor', "not-allowed");
    el.removeAttr('data-toggle');
    el.parent().addClass('disabled');
    el.parent().removeClass('active');
    el.attr('href', "");
    //el.attr('aria-expanded', 'false');
    //let tabPaneEl = makeTabPaneEl( tab );
    //tabPaneEl.removeClass('active');
};
/* boilerplate blank error return function for validated inputs */
export const Helper = {
    err_func : function err_func(error, result) { console.log( error ); }, 

    /* http://stackoverflow.com/questions/17732969/javascript-introspection-that-is-complete */
    findProperties : function(obj) {
        var aPropertiesAndMethods = [];

        do {
            aPropertiesAndMethods = aPropertiesAndMethods.concat(Object.getOwnPropertyNames(obj));
            obj = Object.getPrototypeOf(obj);
        } while ( obj );

        for ( var a = 0; a < aPropertiesAndMethods.length; ++a) {
            for ( var b = a + 1; b < aPropertiesAndMethods.length; ++b) {
                if (aPropertiesAndMethods[a] === aPropertiesAndMethods[b]) {
                    aPropertiesAndMethods.splice(a--, 1);
                }
            }
        }

        return aPropertiesAndMethods;
    },
    // http://www.josscrowcroft.com/2011/code/format-unformat-money-currency-javascript/
    toCash : function formatMoney(number, places, symbol, thousand, decimal) {
        number = number || 0;
        places = !isNaN(places = Math.abs(places)) ? places : 2;
        symbol = symbol !== undefined ? symbol : "$";
        thousand = thousand || ",";
        decimal = decimal || ".";
        var negative = number < 0 ? "-" : "",
            i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
    },
    // from https://gist.github.com/izumskee/b3eca69d2502ae1aee88
    throwError : function(error, reason, details) {
        error = new Meteor.Error(error, reason, details);
        if (Meteor.isClient) {
            return error;
        } else if (Meteor.isServer) {
            throw error;
        }
    },
    activateTab : activateTab,
    makeTabEl : makeTabEl,
    disableTab : disableTab,
    enableTab : enableTab,
    updateNavBar: function(activeTab, currentSection) {
        //let tab = templateData.currentTab;
        let toInclude;
        let secs = Object.keys( DesignSequence );
        let sec = currentSection;

        // set reactive var

        // set tabs up
        //let allTabs = [ 'instructions', 'quiz', 'experiment1', 'experiment2', 'survey', 'submitHIT' ]; ///XXX
        //let page = this.data.page;
        //console.log("Helper.updateNavBar. section and sections:", sec, secs);
        if (sec === "instructions") {
            toInclude = [ 'instructions'];
        } else if (sec === "quiz") {
            toInclude = [ 'instructions', 'quiz' ];
        } else if (sec === "experiment1") {
            toInclude = [ 'instructions', 'experiment1' ];
        } else if (sec === "experiment2") {
            toInclude = [ 'instructions', 'experiment2' ];
        } else if (sec === "survey") {
            toInclude = [ 'survey']; ///XXX
        } else if (sec === "submitHIT") {
            toInclude = [ 'submitHIT' ]; ///XXX
        } else {
            console.log("BIG RPOBLEMFDF", sec);
        }
        try { // sanity checks
            console.assert( toInclude.includes( activeTab ), "active tab test");
            console.assert( toInclude.includes( currentSection ), "current section tab test");
        } catch(err) {
            console.log(err);
        }
        // disable non-active tabs
        _.forEach( secs , function(tab) {
            let tabEl = makeTabEl( tab );

            if (toInclude.includes( tab ) ) {
                //console.log("enabling", tab);
                enableTab( tab );
                // set active tab
                if (tab === activeTab) {
                    //console.log("activating", tab);
                    activateTab( tab);
                }
            } else {
                //console.log("disabling", tab);
                disableTab( tab );
            }


        } );

        //thi is only here so I can reload the template on command
        //// cactive tab
        //let tabRef = _.join( [ ".expTabs a[href='#", UserElements.currentTab.get(), "']" ], '' );
        //$( tabRef ).tab('show'); //make active
        //
        //console.log( "main.onRendered", secObj,  " and page is ", this.data );
    },
	getHasError: function( question ){
        //console.log("hasError", question, this);
        if (question.hasError ) {
        //if (Questions.findOne( id ).hasError ) {
            return("has-error");
        }
	},
    buttonsReset : function (form) {
        //console.log("buttonsReset", $( form ).find(".expQuestion"));
        $( form ).find(".expQuestion").each( function( el ) {
            //let id = b.id;
            let id = this.id;
            // uncheck all buttons in this question
            $( this ).find( ".expChoice" ).each( function( el ) {
                $( this ).removeAttr( "checked" );
                $( this ).removeClass( "active" );
                $( this ).removeAttr( "choice" );
            });
        });
    },
    questions : function( questions, sub, section, dataContext, shuffled=false ) {
        //console.log("experiment.helpers qusetions", questions, this, shuffled);
        if ( sub ) {
            //questions = questions.find({sec: section, sec_rnd : sub.sec_rnd_now }, {$sort : { order : 1 }}).fetch();
            questions = questions.fetch();
            _.forEach( questions, function( q ) {
                //q.context = dataContext;// this was a bad idea, better to make sure that the items passed have the right info from thebeginning
                //console.log("experiment.helpers qusetions per q", q);
            });
            if (shuffled) {
                return( _.shuffle( questions ) );
            } else {
                return( questions );
            }
        }
    },
    gameDisabled : function( question ){
        //console.log("questionGame", Template.currentData());
        if (_.isNil(question)) return;
        if (question.disabled) return("disabled");
    },
    questionDisabled : function( question ){
        if (_.isNil(question)) return;
        //console.log("questionDisabled", Template.currentData());
        if (question.disabled) return("disabled");
	},
    des : function(design) {
        return( _.pick(design, ["id", "cohortId", "sec_type", "playerOne", "playerTwo", "filledCohort", "completedCohort"]) );
    },
};


// I'd like to get these somewhere else.  inQuiz is used client side
TurkServer.inQuiz = function() {
  return Session.equals("turkserver.state", "quiz");
};
TurkServer.setQuizState = function(asst) {
    //console.log("set quiz");
    // This does not emit an event to lobby, so you'd better already be there if you 
    //   want something to happen.  Otherwise, if you're on the client, 
    //   you can call router explicitly
    Meteor.users.update(asst.userId, {
      $set: {
        "turkserver.state": "quiz"
      }
    });
};
TurkServer.setExperimentState = function(asst) {
    //console.log("set experiment");
    // this does not emit an event to lobby, so you'd better already be there
    Meteor.users.update(asst.userId, {
      $set: {
        "turkserver.state": "experiment"
      }
    });
};
TurkServer.setLobbyState = function(asst, batch) {
    // this emits an event to lobby
    batch.lobby.addAssignment( asst );
};
