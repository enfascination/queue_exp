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
        return Sess.sub().sec_now;
    },
    round: function () {
        return Sess.sub().sec_rnd_now;
    },
    maxPlayersInCohort: function () {
        let aDesign = Sess.design();
        return aDesign.maxPlayersInCohort;
    },
    queuePosition: function () {
        return Sess.sub().queuePosition;
    },
    queueCountA: function () {
        return Sess.sub().queueCountA;
    },
    queueCountB: function () {
        return Sess.sub().queueCountB;
    },
    queueCountNoChoice: function () {
        return Sess.sub().queueCountNoChoice;
    },
});

Template.experimenterViewCurrentSubject.helpers({
    userId: function () {
        return Sess.sub().userId;
    },
    meteorUserId: function () {
        return Meteor.userId();
    },
    cohortId: function () {
        return Sess.design().cohortId;
    },
});

Template.experimenterViewPayouts.onCreated( function() {
    Session.set('showQueueCalc', false);
});

Template.experimenterViewPayouts.helpers({

    subjects() {
        return SubjectsData.find( { "theData.cohortId": Session.get('selectedQueue') }, { sort: { sec: 1 , sec_rnd : 1, "theData.queuePositionFinal": 1, "theData.queuePosition": 1 } } );
    },

    showQueueCalc: function() {
        // the last queue is complete when the next shows it's first subject.
        return( Session.get('showQueueCalc') );
    },

});
Template.experimenterViewPayout.helpers({
    userId: function () {
        return Sess.sub().userId;
    },
    completedChoice: function (subject) {
        return(subject.completedChoice);
    },
    completedExperiment: function (subject) {
        subbk = SubjectsStatus.findOne({ meteorUserId : subject.meteorUserId });
        return(subbk.completedExperiment);
    },
    completedCohort: function (subject) {
        cohort = CohortSettings.findOne({ cohortId : subject.cohortId, sec : subject.sec , sec_rnd : subject.sec_rnd });
        return(cohort.completedCohort);
    },
    earningsQueue: function (subject) {
        return Helper.toCash( subject.earnings2 );
    },
    earningsTotal: function (subject) {
        if ( !_.isNumber( subject.earnings1 ) || !_.isNumber( subject.earnings2 ) ) {
            return("error");
        } else {
            return Helper.toCash( subject.earnings1 + subject.earnings2 );
        }
    },
});

Template.queueSelection.onCreated( function(){
    //let group = TurkServer.group();
    //if (_.isNil(group) ) return;
    //Meteor.subscribe('s_data_full');
    //Meteor.subscribe('s_status_full');
    //Meteor.subscribe('designs');
    //let allSubs = SubjectsData.find().fetch();
    //console.log("from sub sub top" ,_.map(allSubs, (s) => s.cohortId));
});
// https://github.com/lookback/meteor-dropdowns
Template.queueSelection.helpers({
    //items: ['Foo', 'Bar', 'Baz'],
    //https://coderwall.com/p/o9np9q/get-unique-values-from-a-collection-in-meteor
    items: function() {
        let allSubs = SubjectsData.find().fetch();
        let allQueuesObj = _.uniqBy(allSubs, (d) =>  parseInt(d.theData.cohortId) );
        let allQueueIds = _.map(allQueuesObj, "theData.cohortId").sort();
        return(allQueueIds);
  },
});
// http://stackoverflow.com/questions/28528660/meteor-dropdown-list-get-and-set
Template.queueSelection.events({
    "change .dropdown__menu": function (e, template) {
        let queueToCalculate = +$(e.currentTarget).val();
        Session.set('selectedQueue', queueToCalculate);
        // (re)calculate earnings
        let designs = CohortSettings.find( {cohortId: queueToCalculate }, { sort : { sec : -1, sec_rnd : -1 } } ).fetch();
        for ( let design of designs) {
            Meteor.call('tryToCompleteCohort', queueToCalculate, design );
        }
        Session.set('showQueueCalc', true);
    }
});

