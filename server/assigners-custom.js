/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

export let QueueAssigner = class extends TurkServer.Assigners.SimpleAssigner {

    userJoined(asst) {
        var currentUser = SubjectsStatus.findOne({ meteorUserId:asst.userId });
        // has to be before the super call.
        if (asst.getInstances().length > 0) {
            this.lobby.pluckUsers([asst.userId]);
            asst.showExitSurvey();
        } else {
            // this will be for the instructions in the lobby before the experiment
            // to get out of this it'll be neessary to institiualze the user and/or create a passedquiz flag
            if(!currentUser){
                Meteor.call("initializeSubject", asst);
                currentUser = SubjectsStatus.findOne({ meteorUserId:asst.userId });
            }

            if ( (currentUser.tookQuiz < 2) && !currentUser.passedQuiz ) {
                //console.log("in1");
                this.lobby.pluckUsers([asst.userId]);
                TurkServer.setInstruction(asst);
            } else if ( currentUser.passedQuiz ) {
                //console.log("in2");
                // if user hasn't yet been sent to experiment, create them an id based on the ids of preceding subjects
                //console.log( asst );// asst.userId is the meteor userid
                const treatments = this.batch.getTreatments() || [];
                this.assignToNewInstance([asst], treatments);
            } else { //failed quiz too many times
                //console.log("in3");
                this.lobby.pluckUsers([asst.userId]);
                asst.showExitSurvey();
            }
        }
    }

    userStatusChanged(asst, newStatus) {
        console.log("status: ", newStatus);
        super.userStatusChanged(asst, newStatus);
    }

};
