/*jshint esversion: 6 */

var _ = require('lodash');
import { Questions } from '../../imports/startup/experiment.js';

/* boilerplate blank error return function for validated inputs */
export const Helper = {
    err_func : function err_func(error, result) { console.log( error ); }, 

    /* http://stackoverflow.com/questions/17732969/javascript-introspection-that-is-complete */
    findProperties : function(obj) {
        var aPropertiesAndMethods = [];

        do {
            aPropertiesAndMethods = aPropertiesAndMethods.concat(Object.getOwnPropertyNames(obj));
        } while (obj = Object.getPrototypeOf(obj));

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
    testProceed : function() {
            let muid = Meteor.userId();
            let sub = SubjectsStatus.findOne({ meteorUserId: muid } );
            //console.log("testProceed", muid, sub );
            if (muid && sub ) {
                return( sub.readyToProceed );
            }
    },
    questionHasError : function ( el, hasError ) {
        //console.log("questionHasError", el, el.id, Questions.find({section: "quiz"}).fetch() );
        console.log("questionHasError", el);
        let output = Questions.update( {_id : el.id }, { $set : { "hasError" : hasError }} );
        //console.log("questionHasError", el.id, Questions.findOne( el.id ), output);
    },
};
Helper.buttonsReset = function (form) {
        console.log("buttonsReset", $( form ).children(".expQuestion"));
        $( form ).children(".expQuestion").each( function( el ) {
            //let id = b.id;
            let id = this.id;
            // uncheck all buttons in this question
            Helper.questionHasError( this, false);
            $( this ).find( "button.expChoice" ).each( function( el ) {
                $( this ).removeAttr( "checked" );
            });
        });
    };
Helper.buttonsDisable = function (form) {
        console.log("buttonsDisable", $( form ).children(".expQuestion"));
        $( form ).children(".expQuestion").each( function( el ) {
            //let b = $( this );
            //let id = b.id;
            let id = this.id;
            let output = Questions.update( {_id : id }, { $set : { disabled : true }} );
            console.log(this, el, id, Questions.findOne( id ));
        });
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

