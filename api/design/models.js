/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

let Schemas = {};
Schemas.SubjectsData = new SimpleSchema({
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
    queuePositionFinal: {
        type: SimpleSchema.Integer,
        label: "Ultimate order in line",
    },
    choice: {
        type: String,
        label: "Choice of queue",
    },
    earnings1: {
        type: Number,
        label: "Experiment earnings from before and during choice",
        decimal: true,
    },
    earnings2: {
        type: Number,
        label: "Experiment earnings from after experiment",
        decimal: true,
    },
    totalPayment: {
        type: Number,
        label: "Total experiment earnings",
        decimal: true,
    },
    theTimestamp: {
        type: Date,
        label: "Timestamp",
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
});

Schemas.SubjectsStatus = new SimpleSchema({
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
    tookQuiz: {
        type: SimpleSchema.Integer,
        label: "Number of times quizzed",
    },
    passedQuiz: {
        type: Boolean,
        label: "Passed quiz",
    },
    completedChoice: {
        type: Boolean,
        label: "completed survey?",
    }, 
    completedCohort: {
        type: Boolean,
        label: "completed experiment?",
    }, 
    tsAsstId: {
        type: String,
        label: "TS asstId",
    },
    tsBatchId: {
        type: String,
        label: "TS batchId",
    },
    tsGroupId: {
        type: String,
        label: "TS Group/partitionId",
    },
    mtHitId: {
        type: String,
        label: "MT Hit Id",
    },
    mtAssignmentId: {
        type: String,
        label: "MT Assignment Id",
    },
    mtWorkerId: {
        type: String,
        label: "MT Worker Id",
    },
});

Schemas.CohortSettings = new SimpleSchema({
    cohortId: {
        type: SimpleSchema.Integer,
        label: "group number",
    },
    maxPlayersInCohort: {
        type: SimpleSchema.Integer,
        label: "Max size of queue",
    },
    endowment: {
        type: Number,
        label: "Initial earnings",
        decimal: true,
    },
    pot: {
        type: Number,
        label: "Max potential queue earnings",
        decimal: true,
    },
    positionCosts: {
        type: Number,
        label: "Per person queue earnings penalty",
        decimal: true,
    },
    queueNames: {
        type: [String],
        label: "List of queues",
    },
    queueCosts: {
        type: Object,
        label: "Costs of queues",
    },
});

Design = {
    maxPlayersInCohort : 4,
    endowment : 1.00,
    pot : 1.00,
    queueNames : [ 'A', 'B' ],
    queueCosts : { "A": 0.50, 'B': 0.00 },
    positionCosts : 0.25,
};
UserElements = {
    experimenterView : true,
};

SubjectsData = new Mongo.Collection('s_data');
SubjectsStatus = new Mongo.Collection('s_status');
SubjectsData.attachSchema(Schemas.SubjectsData);
SubjectsStatus.attachSchema(Schemas.SubjectsStatus);
CohortSettings = new Mongo.Collection('designs');
//CohortSettings.attachSchema(Schemas.CohortSettings);
//TurkServer.partitionCollection(SubjectsData);
//TurkServer.partitionCollection(CohortSettings);


