/*jshint esversion: 6 */

import { Session } from 'meteor/session';
import { Sess } from '../../imports/lib/quick-session.js';
import { Helper } from '../../imports/lib/helper.js';

Template.experimenterViewState.onCreated( function(){
    let group = TurkServer.group();
    if (group === null) return;
    Meteor.subscribe('designs', group);
});
Template.experimenterViewState.helpers({
    queuePosition: function () {
        return Sess.sub().queuePosition;
    },
    cohortId: function () {
        return Sess.sub().cohortId;
    },
    maxPlayersInCohort: function () {
        let aDesign = Sess.design();
        return aDesign.maxPlayersInCohort;
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
        return Sess.sub().cohortId;
    },
});

Template.experimenterViewPayouts.onCreated( function() {
    Session.set('showQueueCalc', false);
});

Template.experimenterViewPayouts.helpers({

    subjects() {
        return Subjects.find({ cohortId: Session.get('selectedQueue') }, { sort: { queuePositionFinal: 1, queuePosition: 1 } });
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

// https://github.com/lookback/meteor-dropdowns
Template.queueSelection.helpers({
    //items: ['Foo', 'Bar', 'Baz'],
    //https://coderwall.com/p/o9np9q/get-unique-values-from-a-collection-in-meteor
    items: function() {
        let allSubs = Subjects.find().fetch();
        let allQueuesObj = _.uniq(allSubs, true, (d) => {return(d.cohortId);});
        let allQueueIds = _.pluck(allQueuesObj, "cohortId");
        return(allQueueIds);
  },
});
// http://stackoverflow.com/questions/28528660/meteor-dropdown-list-get-and-set
Template.queueSelection.events({
    "change .dropdown__menu": function (event, template) {
        let queueToCalculate = +$(event.currentTarget).val();
        Session.set('selectedQueue', queueToCalculate);
        // (re)calculate earnings
        let cohort = Subjects.find({
            cohortId : queueToCalculate, 
            choice: { $ne: 'X' } 
        });
        let design = CohortSettings.findOne( {cohortId: queueToCalculate } );
        if ( cohort.fetch().length === design.maxPlayersInCohort ) {
            Meteor.call( 'calculateQueueEarnings', queueToCalculate, design );
        }
        Session.set('showQueueCalc', true);
    }
});

