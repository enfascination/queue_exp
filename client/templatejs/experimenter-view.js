/*jshint esversion: 6 */

var _ = require('lodash');
import { Session } from 'meteor/session';
import { Sess } from '../../imports/lib/quick-session.js';
import { Helper } from '../../imports/lib/helper.js';

Template.experimenterView.onCreated( function(){
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
    Meteor.subscribe('s_data_full');
    Meteor.subscribe('s_status_full');
    Meteor.subscribe('designs');
});
Template.experimenterViewState.helpers({
    cohortId: function () {
        let design = Sess.design( );
        if( !_.isNil( design ) ) {
            return design.cohortId;
        }
    },
    section: function () {
        let sub = Sess.subData();
        if( !_.isNil( sub ) && !_.isNil( sub[0] ) ) {
            return(sub[0].sec_now);
        }
    },
    round: function () {
        let sub = Sess.subData();
        if( !_.isNil( sub ) && !_.isNil( sub[0] ) ) {
            return(sub[0].sec_rnd_now);
        }
    },
    maxPlayersInCohort: function () {
        let aDesign = Sess.design();
        if (aDesign) {
            return aDesign.maxPlayersInCohort;
        }
    },
    queuePosition: function () {
        let sub = Sess.subData();
        if( sub && !_.isNil( sub ) && !_.isNil( sub[0] ) ) {
            return sub[0].theData.queuePosition;
        }
    },
    queueCountA: function () {
        let sub = Sess.subData();
        if( !_.isNil( sub ) && !_.isNil( sub[0] ) ) {
            return sub[0].theData.queueCountA;
        }
    },
    queueCountB: function () {
        let sdata = Sess.subData();
        if( !_.isNil( sdata ) && !_.isNil( sdata[0] ) ) {
            return sdata[0].theData.queueCountB;
        }
    },
    queueCountNoChoice: function () {
        let sdata = Sess.subData();
        if( !_.isNil( sdata ) && !_.isNil( sdata[0] ) ) {
            return sdata[0].theData.queueCountNoChoice;
        }
    },
});

Template.experimenterViewCurrentSubject.helpers({
    userId: function () {
        let sub = Sess.subStat();
        if( !_.isNil( sub ) ) {
            return sub.userId;
        }
    },
    meteorUserId: function () {
        return Meteor.userId();
    },
    cohortId: function () {
        let design = Sess.design( );
        if( !_.isNil( design ) ) {
            return design.cohortId;
        }
    },
});

Template.experimenterViewPayouts.onCreated( function() {
    Session.set('showExperimentCalc', false);
});

Template.experimenterViewPayouts.helpers({

    subjects() {
        //console.log(SubjectsData.find().count(), SubjectsData.find({ sec_type : "experiment" }).count(), SubjectsData.find() );
        return SubjectsData.find( { "theData.cohortId": Session.get('selectedChoice'), sec_type : "experiment" }, { sort: { sec: 1 , sec_rnd : 1, "theData.queuePositionFinal": 1, "theData.queuePosition": 1 } } );
    },

    showExperimentCalc: function() {
        // the last queue is complete when the next shows it's first subject.
        return( Session.get('showExperimentCalc') );
    },

});
Template.experimenterViewPayout.helpers({
    userId: function () {
        return Sess.subStat().userId;
    },
    completedChoice: function (subject) {
        console.log(subject.completedChoice);
        return(subject.completedChoice);
    },
    completedExperiment: function (subject) {
        let subbk = Sess.subStat();
        return(subbk.completedExperiment);
    },
    completedCohort: function (subject) {
        cohort = CohortSettings.findOne({ cohortId : subject.theData.cohortId, sec : subject.sec , sec_rnd : subject.sec_rnd });
        if (cohort) {
            return(cohort.completedCohort);
        }
    },
    earningsChoice: function (subject) {
        return Helper.toCash( subject.theData.earnings2 );
    },
    earningsTotal: function (subject) {
        if ( !_.isNumber( subject.theData.earnings1 ) || !_.isNumber( subject.theData.earnings2 ) ) {
            return("error");
        } else {
            return Helper.toCash( subject.theData.earnings1 + subject.theData.earnings2 );
        }
    },
});

Template.cohortSelection.onCreated( function(){
    let group = TurkServer.group();
    if (_.isNil(group) ) return;
    Meteor.subscribe('s_data_full');
    Meteor.subscribe('s_status_full');
    Meteor.subscribe('designs');
    //let allSubs = SubjectsData.find().fetch();
    //console.log("from sub sub top" ,_.map(allSubs, (s) => s.cohortId));
});
// https://github.com/lookback/meteor-dropdowns
Template.cohortSelection.helpers({
    //items: ['Foo', 'Bar', 'Baz'],
    //https://coderwall.com/p/o9np9q/get-unique-values-from-a-collection-in-meteor
    items: function() {
        let allSubs = SubjectsData.find({sec_type : "experiment"}).fetch();
        let allCohortIds = _(allSubs).map("theData.cohortId").compact().map(_.toInteger).uniq().sortBy().reverse().value();
        //console.log(_(allSubs).map("theData.cohortId").compact().map(_.toInteger).uniq().sortBy().reverse().value());
        //let allCohortsObj = _.uniqBy(allSubs, (d) =>  parseInt(d.theData.cohortId) );
        //let allCohortIds = _.map(allCohortsObj, "theData.cohortId").sort();
        return(allCohortIds);
  },
});
// http://stackoverflow.com/questions/28528660/meteor-dropdown-list-get-and-set
Template.cohortSelection.events({
    "change .dropdown__menu": function (e, template) {
        let cohortToCalculate = +$(e.currentTarget).val();
        Session.set('selectedChoice', cohortToCalculate);
        // (re)calculate earnings
        let designs = CohortSettings.find( {cohortId: cohortToCalculate }, { sort : { sec : -1, sec_rnd : -1 } } ).fetch();
        for ( let design of designs) {
            Meteor.call('tryToCompleteCohort', design );
        }
        Session.set('showExperimentCalc', true);
    }
});

