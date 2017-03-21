/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

export let QueueAssigner = class extends TurkServer.Assigners.SimpleAssigner {

    userJoined(asst) {
        var currentUser = SubjectsStatus.findOne({ meteorUserId:asst.userId });
        // has to be before the super call.
        console.log("assigner" );
        //console.log("assigner", Meteor.users.findOne(asst.userId).turkserver.state, currentUser );
        if (asst.getInstances().length === 0) { // before experiment
            // this will be for the instructions in the lobby before the experiment
            if(!currentUser){
                console.log("created new user", asst.userId, asst.assignmentId );
                Meteor.call("initializeSubject", asst, Design, function(err) {
                    if (err) { throw( err ); }
                    currentUser = SubjectsStatus.findOne({ meteorUserId:asst.userId });
                    Meteor.call("addSectionQuestions", currentUser, "quiz", Design);
                });
            }

            if ( currentUser.sec_type_now === 'quiz' ) {
                console.log("in quiz");
                this.lobby.pluckUsers([asst.userId]);
                TurkServer.setQuizState(asst);
            } else if ( currentUser.sec_type_now === 'experiment' ) { // no mention of survey state intentional
                // if user hasn't yet been sent to experiment, create them an id based on the ids of preceding subjects
                console.log("in experiment");
                const treatments = this.batch.getTreatments() || [];
                this.assignToNewInstance([asst], treatments);
                TurkServer.setExperimentState(asst, this);
                console.log("in2", asst );// asst.userId is the meteor userid
            } else if ( currentUser.sec_type_now === 'submitHIT' ) { //failed quiz too many times
                console.log("in exit survey");
                //console.log("in3");
                this.lobby.pluckUsers([asst.userId]);
                asst.showExitSurvey();
            } else {
                console.log("in trouble");
            }
        } else { // after main experiment
            console.log("in exit survey 2");
            this.lobby.pluckUsers([asst.userId]);
            asst.showExitSurvey();
        }
        //console.log("assigner out", Meteor.users.findOne(asst.userId).turkserver.state );
    }

    userStatusChanged(asst, newStatus) {
        console.log("status: ", newStatus);
        super.userStatusChanged(asst, newStatus);
    }

};
