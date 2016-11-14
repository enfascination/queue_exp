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
        return Sess.design().cohortId;
    },
    section: function () {
        if( !_.isNil( Sess.subData() ) && !_.isNil( Sess.subData()[0] ) ) {
            return(Sess.subData()[0].sec_now);
        }
    },
    round: function () {
        if( !_.isNil( Sess.subData() ) && !_.isNil( Sess.subData()[0] ) ) {
            return(Sess.subData()[0].sec_rnd_now);
        }
    },
    maxPlayersInCohort: function () {
        let aDesign = Sess.design();
        return aDesign.maxPlayersInCohort;
    },
    queuePosition: function () {
        if( !_.isNil( Sess.subData() ) && !_.isNil( Sess.subData()[0] ) ) {
            return Sess.subData()[0].theData.queuePosition;
        }
    },
    queueCountA: function () {
        if( !_.isNil( Sess.subData() ) && !_.isNil( Sess.subData()[0] ) ) {
            return Sess.subData()[0].theData.queueCountA;
        }
    },
    queueCountB: function () {
        if( !_.isNil( Sess.subData() ) && !_.isNil( Sess.subData()[0] ) ) {
            return Sess.subData()[0].theData.queueCountB;
        }
    },
    queueCountNoChoice: function () {
        if( !_.isNil( Sess.subData() ) && !_.isNil( Sess.subData()[0] ) ) {
            return Sess.subData()[0].theData.queueCountNoChoice;
        }
    },
});

Template.experimenterViewCurrentSubject.helpers({
    userId: function () {
        return Sess.subStat().userId;
    },
    meteorUserId: function () {
        return Meteor.userId();
    },
    cohortId: function () {
        return Sess.design().cohortId;
    },
});

Template.experimenterViewPayouts.onCreated( function() {
    Session.set('showExperimentCalc', false);
});

Template.experimenterViewPayouts.helpers({

    subjects() {
        //console.log(SubjectsData.find().count(), SubjectsData.find({ sec : "experiment" }).count(), SubjectsData.find() );
        return SubjectsData.find( { "theData.cohortId": Session.get('selectedChoice'), sec : "experiment" }, { sort: { sec: 1 , sec_rnd : 1, "theData.queuePositionFinal": 1, "theData.queuePosition": 1 } } );
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
        subbk = SubjectsStatus.findOne({ meteorUserId : subject.meteorUserId });
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
        let allSubs = SubjectsData.find({sec : "experiment"}).fetch();
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

