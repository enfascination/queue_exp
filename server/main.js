/*jshint esversion: 6 */

import '../api/design/models.js';
import { Helper } from '../imports/lib/helper.js';

import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';


    Meteor.startup(function () {
        Batches.upsert({name: "main"}, {name: "main", active: true});
        let batch = TurkServer.Batch.getBatchByName("main");
        batch.setAssigner(new TurkServer.Assigners.SimpleAssigner());
    });

    TurkServer.initialize(function() {
        let clickObjA = {count: 0, queueID: 'A'};
        let clickObjB = {count: 0, queueID: 'B'};
        Queues.insert(clickObjA);
        Queues.insert(clickObjB);
    });

    Meteor.publish('queues', function() {
        return Queues.find();
    });
    Meteor.publish('queueVotes', function() {
        return QueueVotes.find();
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
            let queueVote = {queuePicked: choice, user: Meteor.userId()};
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
    });
