/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';
import { TurkServer } from 'meteor/mizzao:turkserver';
import 'bootstrap-sass';

import '../imports/startup/client/routes.js';
import { Helper } from '../imports/lib/helper.js';
import { Sess } from '../imports/lib/quick-session.js';

Tracker.autorun(function() {
    //console.log("routing", Meteor.users.findOne(asst.userId).turkserver.state );
    console.log("routing", TurkServer.inQuiz(), TurkServer.inExperiment(), TurkServer.inExitSurvey(), this.location.pathname, this.location.pathname.match(/\d*$/) , this.location.pathname.match(/\d*$/)[0], _.toInteger( this.location.pathname.match(/\d*$/)[0] ));
    if (TurkServer.inExperiment()) {
        Router.go('experiment');
    } else if (TurkServer.inQuiz()) {
        // stage of instructions
        let stage = this.location.pathname.match(/\d*$/)[0];
        if (stage === '') {
            stage = 7;
        } else {
            stage = _.toInteger( stage );
        }
        Router.go('start', { stage:stage });
    } else if (TurkServer.inExitSurvey()) {
        Router.go('submitHIT');
    } else {
        //Router.go('/home');
        console.log("failed into lobby");
    }
});

Template.main.onCreated( function(){
    //initialize ui state
    UserElements.choiceChecked = new ReactiveDict(); // this is so there can be mulplie of these buttons on a page
    //Meteor.call('testErrors');
});

Template.main.onRendered( function(){ 
    if ( true ) {
    let instance = this;
    //console.log("main.onRendered", this.data, Template.currentData());
    // for getting tabs right on data updates
        instance.autorun(function () {
            let currentDataContext = Template.currentData();
            //if (subscription.ready()) {
            //console.log("main autorun onRendered", Template.currentData());
            if ( currentDataContext && currentDataContext.hasOwnProperty('currentSection') ) {
                // fixed at https://forums.meteor.com/t/bug-onrendered-executes-too-early/17912
                Tracker.afterFlush(() => {
                    //set local vars
                    let sec = currentDataContext.currentSection.id;
                    //console.log("before flush", sec, currentDataContext);
                    Helper.updateNavBar(currentDataContext.currentTab, sec);
                    //console.log("after flush", sec);
                });
            }
        });
    }
}//;
);

Tracker.autorun(function() {
   /* 
    if (false) {
        if ( TurkServer.inQuiz() ) {
            Meteor.subscribe('s_status');
            Meteor.subscribe('s_data');
        } else if ( TurkServer.inExitSurvey() ) {
        } else if ( TurkServer.inExperiment() ) {
            let group = TurkServer.group();
            //console.log("group", group);
            if (_.isNil(group) ) return;
            //Meteor.subscribe('s_data', group);
            //Meteor.subscribe('s_status', group);
            //Meteor.subscribe('designs', group);
            Meteor.subscribe('s_data');
            Meteor.subscribe('s_status');
            Meteor.subscribe('designs');
        }
}
*/
});

//Tracker.autorun(function() {
//});

//Tracker.autorun(function() {
    //let group = TurkServer.group();
    //if (_.isNil(group) ) return;
//});


//""" takes javascript element referring to a Bootstrap navigation tab and disables it"""
Template.main.helpers({
    testTest : function() {
        console.log( "main", Template.instance(), Template.currentData(), 'lllll' );
    },
    showExperimenterView: function() {
        //console.log("showExperimenterView", UserElements.experimenterView, Sess.subStat() );
        return( ( UserElements.experimenterView || TurkServer.isAdmin() ) &&
              //( Sess.design() && Sess.subData() ) );
              ( Sess.subStat() && Sess.subStat().sec_type_now === "experiment" ) );
    },
    expSectionTabs : function() {
        if ( _.isNil( Template.currentData()) || _.isNil( Template.currentData().design) || _.isNil( Template.currentData().design.sequence) ) { return; }
        let dataContext = Template.currentData();
        let design = Template.currentData().design;
        //let d = _( design.sequence ).omit( [ "instructions", "quiz", "submitHIT" ] ).toArray().value();
        let d = _.map( _.omit( design.sequence, [ "instructions", "quiz", "submitHIT" ] ) , (q)=>q);
        //console.log( "expSectionTabs", Template.currentData(), d );
        //console.log("expSectionTabs ", d);
        _.forEach( d, function( s ) {
            //q.context = dataContext;// this was a bad idea, better to make sure that the items passed have the right info from thebeginning
            s.sec_now = dataContext.subStat.sec_now ; 
            s.sec_rnd_now = dataContext.subStat.sec_rnd_now ; 
        });
        return(d);
    },
});
Template.expSectionTab.onCreated( function() {
});
let currentSectionExperiment = function( ) {
    //console.log("currentSectionExperiment ", this, Template.currentData());
    if (this &&
        this.subStat && 
        this.subStat.sec_now === this.currentTab) {
        return( true );
    }
};
Template.expSectionTab.helpers({
    currentSectionExperiment: currentSectionExperiment,
    expSectionRoundTabs : function () {
        //console.log("expSectionRoundTabs  ", Template.currentData());
        let section = Template.currentData().section;

        let roundObjs = _.map( _.range(section.roundCount), function( num ) {
            let tabState = section.sec_rnd_now === num ? "present" : (section.sec_rnd_now > num ? "past" : "future"); 
            let tabDisabled = "";
            let tabClasses = "";
            if (tabState === "past") {
                tabClasses += "past text-info";
            } else if (tabState === "present") {
                tabClasses += "present text-primary";
            } else if (tabState === "future") {
                tabClasses += "future text-muted";
            }
            return( {
                number : num,
                label : section.rounds[ num.toString() ].label,
                id : section.rounds[ num.toString() ].id,
                state      : tabState, 
                HTMLDisabled : tabDisabled,
                HTMLClasses : tabClasses,
                //subStat : subStat,
                //currentSection : currentSection,
            });
        });
        return( roundObjs ) ;
    },
});
Template.expSectionTabPane.helpers({
    currentSectionExperiment: currentSectionExperiment,
    isSection: function( aSection ){
        return( this.currentSection.id === aSection );
    },
});

/// http://stackoverflow.com/questions/24650658/check-for-equality-in-spacebars
Template.registerHelper('equals', function(v1, v2) {
        return (v1 === v2);
    });
Template.registerHelper( 'notEquals', ( a1, a2 ) => {
      return a1 !== a2;
});
// http://stackoverflow.com/questions/36499595/blaze-logic-not-or-and-in-if-statementj
Template.registerHelper('and',(a,b)=>{
      return a && b;
});
Template.registerHelper('or',(a,b)=>{
      return a || b;
});
Template.registerHelper('inc', function(v1) {
        return ( !_.isNil(v1) ? _.toInteger( v1 ) + 1 : null);
    });
Template.registerHelper('dec', function(v1) {
        return ( !_.isNil(v1) ? _.toInteger( v1 ) - 1 : null);
    });
Template.registerHelper('nbsp', function(v1) {
        return (v1 ? v1.replace(/ /, "&nbsp;" ) : null );
    });
Template.registerHelper('earnings',
    function (earnings, translateFromPoints) {
        design = Sess.design();
        //console.log("earningsHelper", this, Template.currentData());
        //console.log("earnings helper", earnings, translateFromPoints, this);
        if (earnings) {
            // in this if statement I need string test followed by exact 
            // matching of a stirng 
            // (instead of a boolean value to a named variable), because 
            // of weirdness about helpers, spacerbars.kw, and template 
            // arguments being named or not.
            if (_.isString(translateFromPoints) && translateFromPoints === 'translateFromPoints') {  
                return( Helper.toCash( earnings * design.pointEarnings ) );
            } else {
                return( Helper.toCash( earnings ) );
            }
        }
    }
);
