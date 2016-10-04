/*jshint esversion: 6 */

import '../api/design/models.js';

import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';


    Meteor.startup(function () {
        Batches.upsert({name: "main"}, {name: "main", active: true});
        var batch = TurkServer.Batch.getBatchByName("main");
        batch.setAssigner(new TurkServer.Assigners.SimpleAssigner());
    });

    TurkServer.initialize(function() {
        var clickObj = {count: 0, queueID: 'A'};
        Queues.insert(clickObj);
    });

    Meteor.publish('clicks', function() {
        return Queues.find();
    });

    Meteor.methods({
        goToExitSurvey: function() {
            TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
        },
        incClicks: function() {
            Queues.update({queueID: 'A'}, {$inc: {count: 1}});
            var asst = TurkServer.Assignment.currentAssignment();
            asst.addPayment(0.1);
        },
    });
