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
    user: {
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

Queues = new Mongo.Collection('queues');
QueueVotes = new Mongo.Collection('queueVotes');
/*TurkServer.partitionCollection(Clicks);*/

Queues.attachSchema(Schemas.Queues);
QueueVotes.attachSchema(Schemas.QueueVotes);

    


