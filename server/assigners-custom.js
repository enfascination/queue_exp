/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

export let QueueAssigner = class extends TurkServer.Assigners.SimpleAssigner {

  userJoined(asst) {
    // if user hasn't yet been sent to experiment, create them an id based on the ids of preceding subjects
      // has to be before the super call.
    if (asst.getInstances().length <= 0) {
      Meteor.call("initializeSubject", asst.userId);
    }
    super.userJoined(asst);
  }

};
