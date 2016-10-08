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
        //Meteor.call("initializeSubject");
    });

    Meteor.publish('queues', function() {
        return Queues.find();
    });
    Meteor.publish('queueVotes', function() {
        return QueueVotes.find();
    });
    Meteor.publish('subjects', function() {
        return Subjects.find();
    });

    Meteor.methods({
        incClicksA: function() {
            Queues.update({queueID: 'A'}, {$inc: {count: 1}});
            let asst = TurkServer.Assignment.currentAssignment();
            asst.addPayment(0.1);
        },
        incClicksB: function() {
            Queues.update({queueID: 'B'}, {$inc: {count: 1}});
            let asst = TurkServer.Assignment.currentAssignment();
            asst.addPayment(0.1);
        },
        submitQueueChoice: function(choice) {
            let queueVote = {queuePicked: choice, userID: Meteor.userId()};
            QueueVotes.insert(queueVote, Helper.err_func);
            let asst = TurkServer.Assignment.currentAssignment();
            Queues.update({queueID: choice}, {$inc: {count: 1}}, Helper.err_func);
            if (choice === "A") {
                asst.addPayment(0.5);
            }
            else if (choice === "B") {
                asst.addPayment(1.0);
            }
        },
        goToExitSurvey: function() {
            TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
        },
        initializeSubject: function( uid ) {
            let subjectPos, subjectCohort;
            // initialize player objects
            if ( Subjects.find({cohortID: { $exists: true }}).fetch().length > 0) {
                let lastSubject = Subjects.findOne( {}, {sort : {  cohortID : -1, queuePosition : -1 } } ) ;
                subjectCohort = lastSubject.cohortID;
                subjectPos = lastSubject.queuePosition + 1;
            } else {
                subjectCohort = 1;
                subjectPos = 1;
            }

            // rollover at max
            if (subjectPos <= Design.maxPlayersInCohort) {
                subjectPos = subjectPos;
                subjectCohort = subjectCohort;
            } else {
                subjectPos = 1;
                subjectCohort = subjectCohort + 1;
            }

            Subjects.insert( {
                userID: uid,
                cohortID: subjectCohort,
                queuePosition: subjectPos,
                choice: 'X',
                earnings: Design.endowment,
                completedExperiment: false,
            } );
        },
        getSubject: function() {
            return( Subjects.findOne( {userID: Meteor.userId() } ) );
        },
        getCounterA: function() {
            let clickObjA = Queues.findOne({ queueID: 'A'});
            return( clickObjA );
        },
        getCounterB: function() {
            let clickObjB = Queues.findOne({ queueID: 'B'});
            return( clickObjB );
        },
    });
