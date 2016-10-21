/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

export let QueueAssigner = class extends TurkServer.Assigners.SimpleAssigner {

    userJoined(asst) {
        var currentUser = Subjects.findOne({ meteorUserId:asst.userId });
        // has to be before the super call.
        if (asst.getInstances().length > 0) {
            this.lobby.pluckUsers([asst.userId]);
            asst.showExitSurvey();
        } else {
            // this will be for the instructions in the lobby before the experiment
            // to get out of this it'll be neessary to institiualze the user and/or create a passedquiz flag
            if(!currentUser){
                Meteor.call("initializeSubject", asst);
            } //else {
            // if user hasn't yet been sent to experiment, create them an id based on the ids of preceding subjects
            //console.log( asst );// asst.userId is the meteor userid
            const treatments = this.batch.getTreatments() || [];
            this.assignToNewInstance([asst], treatments);
            //}
        }
    }

    userStatusChanged(asst, newStatus) {
        console.log("status: ", newStatus);
        super.userStatusChanged(asst, newStatus);
    }

};
