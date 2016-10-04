/*jshint esversion: 6 */

import '../api/design/models.js';

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

    Meteor.publish('clicks', function() {
        return Queues.find();
    });

    Meteor.methods({
        goToExitSurvey: function() {
            TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
        },
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
    });
