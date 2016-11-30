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
import { Questions } from '../imports/startup/experiment_prep.js';

Tracker.autorun(function() {
    //console.log("routing", Meteor.users.findOne(asst.userId).turkserver.state );
    console.log("routing", TurkServer.inQuiz(), TurkServer.inExperiment(), TurkServer.inExitSurvey());
    if (TurkServer.inExperiment()) {
        Router.go('/experiment');
    } else if (TurkServer.inQuiz()) {
        Router.go('/start');
    } else if (TurkServer.inExitSurvey()) {
        Router.go('/submitHIT');
    } else {
        console.log("failed into lobby");
    }
});

Template.main.onCreated( function(){
    //initialize ui state
    UserElements.choiceChecked = new ReactiveDict(); // this is so there can be mulplie of these buttons on a page
});

Template.main.onRendered( function(){ 
    if ( true ) {
    let instance = this;
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
    testProceed: Helper.testProceed,
    testTest : function() {
        //console.log( Template.instance(), Template.currentData(), 'lllll' );
    },
    showExperimenterView: function() {
        //console.log("showExperimenterView", UserElements.experimenterView, Sess.subStat() );
        return( ( UserElements.experimenterView || TurkServer.isAdmin() ) &&
              //( Sess.design() && Sess.subData() ) );
              ( Sess.subStat() && Sess.subStat().sec_type_now === "experiment" ) );
    },
    expSectionTabs : function() {
        let design = Sess.design() || Design;
        //console.log( "expSectionTabs", design , this);
        let d = _( design.sequence ).omit( [ "instructions", "quiz", "submitHIT" ] ).toArray().value();
        //console.log(d);
        return(d);
    },
});
Template.expSectionTab.helpers({
    currentSectionExperiment: function() {
        let sub = Sess.subStat();
        if (sub && sub.sec_now === this.id) {
            return( true );
        }
    },
    expSection: function() {
        return(this);
    },
});
Template.expSectionTabPane.helpers({
    currentSectionExperiment: function() {
        let sub = Sess.subStat();
        if (sub && sub.sec_now === this.id) {
            return( true );
        }
    },
    expSection: function() {
        return(this);
    },
});
Template.expSectionTabPane2.helpers({
    currentSectionExperiment: function() {
        let sub = Sess.subStat();
        //console.log("expSectionTabPane2", this, sub);
        if (sub && sub.sec_now === this.expSection.id) {
            return( true );
        }
    },
    isSection: function( aSection ){
        return( this.thisSection.id === aSection );
    },
});

