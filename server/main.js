/*jshint esversion: 6 */

import '../api/design/models.js';
import { QueueAssigner } from '../server/assigners-custom.js';
import { Helper } from '../imports/lib/helper.js';

import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';


    Meteor.startup(function () {
        Batches.upsert({name: "main"}, {name: "main", active: true});
        let batch = TurkServer.Batch.getBatchByName("main");
        //batch.setAssigner(new TurkServer.Assigners.SimpleAssigner());
        batch.setAssigner( new QueueAssigner() );
    });

    TurkServer.initialize( function() {
    });

    Meteor.publish('subjects', function() {
        return Subjects.find();
    });

    Meteor.methods({
        submitQueueChoice: function(muid, choice) {
            let asst = TurkServer.Assignment.currentAssignment();
            if (choice === "A") {
                asst.addPayment(0.5);
                Subjects.update({meteorUserId: muid }, {
                    $set: {choice: "A", earnings: 0.50},
                });
            }
            else if (choice === "B") {
                asst.addPayment(1.0);
                Subjects.update({meteorUserId: muid }, {
                    $set: {choice: "B"},
                });
            }
        },
        goToExitSurvey: function() {
            TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
        },
        initializeSubject: function( idObj ) {
            let subjectPos, subjectCohort, countInA, countInB;
            // initialize player objects
            if ( Subjects.find({cohortId: { $exists: true }}).fetch().length > 0) {
                let lastSubject = Subjects.findOne( {}, {sort : {  cohortId : -1, queuePosition : -1 } } ) ;
                subjectCohort = lastSubject.cohortId;
                subjectPos = lastSubject.queuePosition + 1;
                countInA = Subjects.find({cohortId: subjectCohort, choice: "A"}).fetch().length;
                countInB = Subjects.find({cohortId: subjectCohort, choice: "B"}).fetch().length;
            } else {
                subjectCohort = 1;
                subjectPos = 1;
                countInA = 0;
                countInB = 0;
            }

            // rollover at max
            if (subjectPos > Design.maxPlayersInCohort) {
                subjectPos = 1;
                subjectCohort = subjectCohort + 1;
                countInA = 0;
                countInB = 0;
            }

            Subjects.insert( {
                userId: idObj.assignmentId,
                meteorUserId: idObj.userId,
                cohortId: subjectCohort,
                queuePosition: subjectPos,
                choice: 'X',
                queueCountA: countInA,
                queueCountB: countInB,
                earnings: Design.endowment,
                completedExperiment: false,
            } );
        },
    });
