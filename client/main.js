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
    //console.log("routing");
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

Tracker.autorun(function() {
    //let state;
    //if ( Meteor.users.findOne( Meteor.userId() )) {
        //state = Meteor.users.findOne( Meteor.userId().turkserver.state );
    //}
    //console.log( "state", state );
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
});

Tracker.autorun(function() {
});

Tracker.autorun(function() {
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
});


//""" takes javascript element referring to a Bootstrap navigation tab and disables it"""
let disableTab = function disableTab( el ) {
    el.attr('cursor', "not-allowed");
    el.removeAttr('data-toggle');
    el.parent().addClass('disabled');
    el.attr('href', "");
};
Template.main.onRendered( function() {
    let toDisable = [ 'instructions', 'quiz', 'experiment', 'survey', 'submitHIT' ];
    let page = this.data.page;
    let activeTab = page;
    let sub;
    if (page === "quiz" || page === "instructions") {
        activeTab = "instructions";
        toDisable = [ 'experiment', 'survey', 'submitHIT' ];
    } else if (page === "experiment") {
        toDisable = [ 'quiz', 'survey', 'submitHIT' ];
    } else if (page === "survey") {
        toDisable = [ 'instructions', 'quiz', 'experiment', 'submitHIT' ];
    } else if (page === "submitHIT") {
        toDisable = [ 'instructions', 'quiz', 'experiment', 'survey' ];
    } else {
        console.log("BIG RPOBLEMFDF", page);
    }
    let tabRef = _.join( [ ".nav-tabs a[href='#", activeTab, "']" ], '' );
    $( tabRef ).tab('show'); //make active
    _.forEach( toDisable , function(tab) {
        let tabRef = _.join( [ ".nav-tabs a[href='#", tab, "']" ], '' );
        disableTab( $( tabRef ) );
    } );
    sub = Sess.subStat();
    //console.log( "main.onRendered", sub, SubjectsStatus.findOne({meteorUserId : Meteor.userId() }));
    
    //console.log("onCreated", this.data);
});
Template.main.helpers({
    testProceed: Helper.testProceed,
    testTest : function() {
        console.log( Template.instance(), Template.currentData(), 'lllll' );
    },
    showExperimenterView: function() {
        return( UserElements.experimenterView || TurkServer.isAdmin() );
    },
});
Template.experimentNav.helpers({
    sectionExperiment: function() {
        let sub = SubjectsStatus.findOne({meteorUserId : Meteor.userId() });
        if (sub && sub.sec_now === "experiment") {
            return( true );
        }
    },
    sectionExperimentSurvey: function() {
        let sub = SubjectsStatus.findOne({meteorUserId : Meteor.userId() });
        if (sub && sub.sec_now === "survey") {
            return( true );
        }
    },
});

