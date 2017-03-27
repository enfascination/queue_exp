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
        return this.design.cohortId;
    },
});

Template.experimenterViewCurrentSubjectData.helpers({
    data() {
        let sub = Sess.subStat();
        return SubjectsData.find( { meteorUserId : sub.meteorUserId }, { sort: { sec: 1 , sec_rnd : 1} } );
    },
});
Template.experimenterViewCurrentSubjectDataPoint.helpers({
    dataString : function( dataPoint ) {
        let sectionData = dataPoint.theData;
        //console.log(  this, dataPoint );
        if (dataPoint.sec === "experiment1" || dataPoint.sec == "experiment2" ) {
            return( JSON.stringify( _.pick(sectionData, ["choice", "payoffs", "outcome"])) );
        } else if (dataPoint.sec === "survey" ) {
            return( JSON.stringify( _.pick(sectionData, ["text", "answered", "choice"])) );
        }
    },
});

Template.experimenterViewPayouts.onCreated( function() {
    Session.set('showExperimentCalc', false);
});

Template.experimenterViewPayouts.helpers({

    subjects() {
        if ( Session.get('selectedChoice') > 0 ) {
            console.log(
                "expView subjects", 
                Session.get('selectedChoice'), 
                SubjectsData.find().count(), 
                SubjectsData.find({ sec_type : "experiment" }).count(), 
                SubjectsData.find( { 
                    "theData.cohortId": Session.get('selectedChoice'), 
                    sec_type : "experiment" 
                }, { sort: { sec: 1 , sec_rnd : 1} } ).fetch() 
            );
            return SubjectsData.find( { 
                "theData.cohortId": Session.get('selectedChoice'), 
                sec_type : "experiment",
            }, { sort: { sec: 1 , sec_rnd : 1} } );
        }
    },
    showExperimentCalc: function() {
        // the last queue is complete when the next shows it's first subject.
        return( Session.get('showExperimentCalc') );
    },
});

Template.experimenterViewPayout.helpers({
    completedExperiment: function (subject) {
        let substat = SubjectsStatus.findOne({ meteorUserId : subject.meteorUserId });
        return( substat ? substat.completedExperiment : '' );
    },
    completedCohort: function (subject) {
        let cohort = CohortSettings.findOne({ cohortId : subject.theData.cohortId});
        //console.log("completedCohort",  cohort, subject.theData.cohortId,subject.sec,subject.sec_rnd, subject );
        if (cohort) {
            return(cohort.completed);
        }
    },
    earningsTotal: function (subject) {
        let substat = SubjectsStatus.findOne({ meteorUserId : subject.meteorUserId });
        return( substat ? Helper.toCash( substat.totalEarnings ) : 'error' );
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
Template.cohortSelection.onRendered( function(){
    // make the default option the most recent new group
    // http://stackoverflow.com/questions/1414276/how-to-make-first-option-of-select-selected-with-jquery
    let selectJQ = $( 'select#category-select' );
    selectJQ.change(); // trigger load activities in "change" event handler below
    //console.log( "cohortSelection.onRendered",selectJQ.length);
    selectJQ[0].selectedIndex = 0;

});
// https://github.com/lookback/meteor-dropdowns
Template.cohortSelection.helpers({
    //items: ['Foo', 'Bar', 'Baz'],
    //https://coderwall.com/p/o9np9q/get-unique-values-from-a-collection-in-meteor
    items: function() {
        let allSubs = SubjectsData.find({sec_type : "experiment"}, {sort : {cohortId : -1}}).fetch();
        //console.log( "items", allSubs );
        let allCohortIds = _(allSubs).map("theData.cohortId").map(_.toInteger).sortBy().sortedUniq().value().reverse();
        //console.log(_(allSubs).map("theData.cohortId").compact().map(_.toInteger).uniq().sortBy().reverse().value());
        //console.log(allCohortIds, _(allSubs).map("theData.cohortId").map(_.toInteger).uniq().sortBy().reverse().value());
        //let allCohortsObj = _.uniqBy(allSubs, (d) =>  parseInt(d.theData.cohortId) );
        //let allCohortIds = _.map(allCohortsObj, "theData.cohortId").sort();
        //console.log( "items", allCohortIds );
        return(allCohortIds);
  },
});
// http://stackoverflow.com/questions/28528660/meteor-dropdown-list-get-and-set
Template.cohortSelection.events({
    "change .dropdown__menu, onLoad .dropdown__menu": function (e, template) {
        let cohortToCalculate = +$(e.currentTarget).val();
        Session.set('selectedChoice', cohortToCalculate);
        // (re)calculate earnings
        let designs = CohortSettings.find( {cohortId: cohortToCalculate } );
        designs.forEach( function(design) {
            //Meteor.call('tryToCompleteCohort', design );
        } );
        try {
            console.assert(designs.count() === 1 || cohortToCalculate === 0, "problem in cohort creation");
        } catch (err) {
            console.log("problem in cohort reporting", designs, cohortToCalculate, template);
            throw(err);
        }
        Session.set('showExperimentCalc', true);
    }
});

