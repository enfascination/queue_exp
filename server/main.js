/*jshint esversion: 6 */

var _ = require('lodash');
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
                // do a collision test for something that may never happen and I won't be able to see it when it does (premature optimization).
                if ( Subjects.find({mtWorkerId : idObj.workerId, cohortId : subjectCohort }).count() > 0 ) {
                    Meteor.call("goToExitSurvey");
                }
            } else {
                // for very very first subject
                firstSubjectEver = true;
                subjectCohort = 0;
            }
            // for rare contingenecies that shold only happened during development
            if (typeof aDesign === 'undefined') {
                aDesign = Design;
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
                totalPayment: 0,
                completedChoice: false,
                completedCohort: false,
                theTimestamp: Date.now(),
                queueCountA: countInA,
                queueCountB: countInB,
                queueCountNoChoice: countInNoChoice,
                tsAsstId: idObj.asstId,
                tsBatchId: idObj.batchId,
                tsGroupId: "undefined",
                meteorUserId: idObj.userId,
                mtHitId: idObj.hitId,
                mtAssignmentId: idObj.assignmentId,
                mtWorkerId: idObj.workerId,
            } );

            //ensure uniqueness
            CohortSettings._ensureIndex({cohortId : 1}, { unique : true } );
            Subjects._ensureIndex({mtWorkerId : 1, cohortId : 1}, { unique : true } );
        },
        addGroupId: function( meteorUserId, groupId ) {
            if ("undefined" in Subjects.find({meteorUserId: meteorUserId}, { fields: {'tsGroupId':1} }).fetch()) {
                let res = Subjects.update({meteorUserId: meteorUserId}, { $set: {tsGroupId : groupId} });
                //console.log(res);
            }
        },
        submitQueueChoice: function(muid, choice, design) {
            let asst = TurkServer.Assignment.currentAssignment();
            let sub = Subjects.findOne({ meteorUserId: muid });
            if (choice === "A") {
                Subjects.update({meteorUserId: muid }, {
                    $set: {
                        choice: "A", 
                        earnings1: design.endowment - design.queueCosts.A,
                        completedChoice: true,
                    },
                });
            }
            else if (choice === "B") {
                Subjects.update({meteorUserId: muid }, {
                    $set: {
                        choice: "B", 
                        earnings1: design.endowment - design.queueCosts.B,
                        completedChoice: true,
                    },
                });
            }
        },
        completeCohort: function(cohortId, design) {
            let cohortFin = Subjects.find({
                cohortId : cohortId, 
                completedChoice: true,
            });
            let cohortUnfin = Subjects.find({
                cohortId : cohortId, 
                completedChoice: false,
            });
            if (cohortFin.count() === design.maxPlayersInCohort ) {
                Subjects.update({ cohortId: cohortId }, {
                    $set: { 
                        completedCohort: true,
                    },
                }, {multi: true}
                );
            } else if ( cohortFin.count() + cohortUnfin.count() === design.maxPlayersInCohort) {
                for ( let sub of cohortUnfin.fetch() ) {
                    // print out subjects that, later, I'll want (need) to address manually.
                    //console.log( sub.userId );
                }
            } else {
                // experiment still in progress
            }
        },
        calculateQueueEarnings: function(cohortId, aDesign) {
            let queueasubjects, queuebsubjects, positionfinal, earnings2, totalpayment, asst;
            queueASubjects = Subjects.find( {cohortId : cohortId, choice : "A"}, {sort : { queuePosition : 1 } } ).fetch() ;
            queueBSubjects = Subjects.find( {cohortId : cohortId, choice : "B"}, {sort : { queuePosition : 1 } } ).fetch() ;
            positionFinal = 1;
            for ( let sub of _.concat(queueASubjects, queueBSubjects ) ) {
                // maybe figure out here how to recover assignment from an old passed subject;
                earnings2 = aDesign.pot - ( (positionFinal-1) * aDesign.positionCosts );
                totalPayment = sub.earnings1 + earnings2;
                Subjects.update({cohortId: cohortId, userId : sub.userId}, {
                    $set: { 
                        earnings2: earnings2, 
                        totalPayment: totalPayment, 
                        queuePositionFinal : positionFinal,
                    },
                });
                asst = TurkServer.Assignment.getAssignment( sub.tsAsstId );
                asst.setPayment( totalPayment );
                positionFinal += 1;
            }
        },
        goToExitSurvey: function() {
            TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
        },
    });
