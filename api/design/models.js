/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

let Schemas = {};
Schemas.Subjects = new SimpleSchema({
    // this is the TurkServer asstId. 
        // it's the finest grain one and the one I shoudl use in data nalayssi.
    userId: {
        type: String,
        label: "User",
    },
    // this is the Meteor.userId for identifying user in-game. 
    meteorUserId: {
        type: String,
        label: "Meteor User",
    },
    cohortId: {
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
    earnings1: {
        type: SimpleSchema.Integer,
        label: "Experiment earnings from before and during choice",
    },
    earnings2: {
        type: SimpleSchema.Integer,
        label: "Experiment earnings from after experiment",
    },
    completedExperiment: {
        type: Boolean,
        label: "completed experiment?",
    }, 
    queueCountA: {
        type: SimpleSchema.Integer,
        label: "Size of Queue A",
    },
    queueCountB: {
        type: SimpleSchema.Integer,
        label: "Size of Queue B",
    },
    queueCountNoChoice: {
        type: SimpleSchema.Integer,
        label: "Number of null choices",
    },
    queuePositionFinal: {
        type: SimpleSchema.Integer,
        label: "Ultimate order in line",
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

Design = {
    maxPlayersInCohort : 10,
    endowment : 1.00,
    pot : 1.00,
    queueNames : ['A', 'B'],
    queueCosts : {A:0.50, B:0.00},
    positionCosts : 0.10,
    experimenterView : true,
};

Subjects = new Mongo.Collection('subjects');
Subjects.attachSchema(Schemas.Subjects);
/*TurkServer.partitionCollection(Clicks);*/


