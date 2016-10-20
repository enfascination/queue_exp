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
    Meteor.publish('designs', function() {
        return CohortSettings.find();
    });

    Meteor.methods({
        submitQueueChoice: function(muid, choice) {
            let asst = TurkServer.Assignment.currentAssignment();
            if (choice === "A") {
                asst.addPayment(0.5);
                Subjects.update({meteorUserId: muid }, {
                    $set: {choice: "A", earnings1: 0.50},
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
            let subjectPos, subjectCohort, countInA, countInB, aDesign, firstSubjectEver;
            // initialize player objects
            if ( Subjects.find({cohortId: { $exists: true } }).fetch().length > 0) {
                /// previous subject may belong to previous cohort. that is what i have to determine
                let previousSubject = Subjects.findOne( {}, { sort : {  cohortId : -1, queuePosition : -1 } });
                subjectCohort = previousSubject.cohortId;
                subjectPos = previousSubject.queuePosition + 1;
                countInA = Subjects.find({ cohortId: subjectCohort, choice: "A" }).fetch().length;
                countInB = Subjects.find({ cohortId: subjectCohort, choice: "B" }).fetch().length;
                countInNoChoice = Subjects.find({ cohortId: subjectCohort, choice: "X" }).fetch().length;
                aDesign = CohortSettings.findOne({ cohortId: subjectCohort });
                // for bad contingenecies that shold only happened during development
                if (typeof aDesign === 'undefined') {
                    aDesign = Design;
                }
            } else {
                // for very very first subject
                firstSubjectEver = true;
                subjectCohort = 0;
            }

            // rollover at max
            if ( ( subjectPos > aDesign.maxPlayersInCohort ) || firstSubjectEver ) {
                subjectPos = 1;
                subjectCohort = subjectCohort + 1;
                countInA = 0;
                countInB = 0;
                countInNoChoice = 0;
                aDesign = Design;
                aDesign.cohortId = subjectCohort; // uid for designs, a unique one for each cohort
                CohortSettings.insert( aDesign );
            }

            Subjects.insert( {
                userId: idObj.assignmentId,
                cohortId: subjectCohort,
                queuePosition: subjectPos,
                queuePositionFinal: -1,
                choice: 'X',
                earnings1: aDesign.endowment,
                earnings2: 0,
                completedExperiment: false,
                theTimestamp: Date.now(),
                queueCountA: countInA,
                queueCountB: countInB,
                queueCountNoChoice: countInNoChoice,
                tsAsstId: idObj.asstId,
                tsBatchId: idObj.batchId,
                meteorUserId: idObj.userId,
                mtHitId: idObj.hitId,
                mtAssignmentId: idObj.assignmentId,
                mtWorkerId: idObj.workerId,
            } );
        },
        calculateQueueEarnings: function(queueId) {
            let aCohort, aDesign, validChoiceCount, queueASubjects, queueBSubjects, decrement, earnings, positionFinal;
            aCohort = Subjects.find( {cohortId : queueId, choice: { $ne: 'X' } }, {sort : { queuePosition : 1 } } ).fetch() ;
            aDesign = CohortSettings.findOne({cohortId: aCohort[0].cohortId});
            validChoiceCount = aCohort.length ;
            if ( validChoiceCount === aDesign.maxPlayersInCohort ) {
                queueASubjects = Subjects.find( {cohortId : queueId, choice:"A"}, {sort : { queuePosition : 1 } } ).fetch() ;
                queueBSubjects = Subjects.find( {cohortId : queueId, choice:"B"}, {sort : { queuePosition : 1 } } ).fetch() ;
                decrement = aDesign.positionCosts;
                earnings = aDesign.pot;
                positionFinal = 1;
                for ( let sub of queueASubjects ) {
                    // maybe figure out here how to recover assignment from an old passed subject;
                    Subjects.update({cohortId: queueId, userId : sub.userId}, {
                        $set: { earnings2: earnings - ( (positionFinal-1) * decrement ), queuePositionFinal : positionFinal },
                    });
                    positionFinal += 1;
                }
                for ( let sub of queueBSubjects ) {
                    // maybe figure out here how to recover assignment from an old passed subject;
                    Subjects.update({cohortId: queueId, userId : sub.userId}, {
                        $set: { earnings2: earnings - ( (positionFinal-1) * decrement ), queuePositionFinal : positionFinal  },
                    });
                    positionFinal += 1;
                }
            }
        },
    });
