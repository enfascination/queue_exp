/*jshint esversion: 6 */

import { Sess } from '../../imports/lib/quick-session.js';

Template.experimenterView.helpers({
    queuePosition: function () {
        return Sess.sub().queuePosition;
    },
    cohortId: function () {
        return Sess.sub().cohortId;
    },
    maxPlayersInCohort: function () {
        return Design.maxPlayersInCohort;
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
    let queueId = Sess.sub().cohortId;
    /// send previous queue (since I want to calculate this only whent he queues is empty.
    Meteor.call( 'calculateQueueEarnings', queueId - 1 );
});
Template.experimenterViewPayouts.helpers({
  subjects() {
    return Subjects.find({ cohortId: Sess.sub().cohortId }, { sort: { queuePositionFinal: 1, queuePosition: 1 } });
  },
});
Template.experimenterViewPayout.helpers({
    userId: function () {
        return Sess.sub().userId;
    },
    earningsTotal: function () {
        return Sess.sub().earnings1 + Sess.sub().earnings2;
    },
});
