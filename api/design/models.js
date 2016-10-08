/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

let Schemas = {};
Schemas.Queues = new SimpleSchema({
    count: {
        type: SimpleSchema.Integer,
        label: "Count",
    },
    queueID: {
        type: String,
        label: "QueueID",
    },
});
Schemas.QueueVotes = new SimpleSchema({
    queuePicked: {
        type: String,
        label: "Queue",
        max: 1,
    },
    userID: {
        type: String,
        label: "User",
    },/*
    timestamp: {
        type: Date,
        label: "Timestamp",
    },
    timestampEpoch: {
        type: Number,
        label: "Epoch",
    },*/
});
Schemas.Subjects = new SimpleSchema({
    userID: {
        type: String,
        label: "User",
    },
    cohortID: {
        type: SimpleSchema.Integer,
        label: "group number",
    },
    queuePosition: {
        type: SimpleSchema.Integer,
        label: "Position in queue",
    },
    choice: {
        type: String,
        label: "Choice of queue",
    },
    earnings: {
        type: SimpleSchema.Integer,
        label: "Experiment earnings",
    },
    completedExperiment: {
        type: Boolean,
        label: "completed experiment?",
    },
});

Design = {
    maxPlayersInCohort : 50,
    endowment : 1.00,
    queueNames : ['A', 'B'],
    queueCosts : [0.50, 0.00],
}

Queues = new Mongo.Collection('queues');
QueueVotes = new Mongo.Collection('queueVotes');
Subjects = new Mongo.Collection('subjects');
/*TurkServer.partitionCollection(Clicks);*/

Queues.attachSchema(Schemas.Queues);
QueueVotes.attachSchema(Schemas.QueueVotes);
Subjects.attachSchema(Schemas.Subjects);

Queues.insert({count: 0, queueID: 'A'});
Queues.insert({count: 0, queueID: 'B'});
    


