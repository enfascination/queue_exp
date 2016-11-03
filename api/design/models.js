/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';

let Schemas = {};

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
    tookQuiz: {
        type: SimpleSchema.Integer,
        label: "Number of times quizzed",
    },
    passedQuiz: {
        type: Boolean,
        label: "Passed quiz",
    },
    completedExperiment: {
        type: Boolean,
        label: "completed survey?",
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
    sec_now: {
        type: SimpleSchema.Integer,
        label: "current section",
    },
    sec_rnd_now: {
        type: SimpleSchema.Integer,
        label: "current round",
    },
    sec_rnd_stg_now: {
        type: SimpleSchema.Integer,
        label: "current stage",
    },
});

Schemas.SubjectsData = new SimpleSchema({
    // this is the TurkServer asstId. 
        // it's the finest grain one and the one I shoudl use in data nalayssi.
    userId: {
        type: String,
        label: "User",
    },
    // this is the Meteor.userId for identifying user in-game. 
    meteorUserId: {  // with better hygeine, this wouldn't be in this collection
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
    sec: {
        type: SimpleSchema.Integer,
        label: "gross section of the experiment",
    },
    sec_rnd: {
        type: SimpleSchema.Integer,
        label: "round in the section",
    },
    completedChoice: {
        type: Boolean,
        label: "completed round?",
    }, 
});

Schemas.CohortSettings = new SimpleSchema({
    cohortId: {
        type: SimpleSchema.Integer,
        label: "group number",
    },
    filledCohort: {
        type: Boolean,
        label: "completed experiment?",
    }, 
    completedCohort: {
        type: Boolean,
        label: "completed experiment?",
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
    sequence: {
        type: Object,
        label: "sequence of the experiment",
    },
    sec: {
        type: SimpleSchema.Integer,
        label: "gross section of the experiment",
    },
    sec_rnd: {
        type: SimpleSchema.Integer,
        label: "round in the section",
    },
});

Design = {
    maxPlayersInCohort : 4,
    endowment : 1.00,
    pot : 1.00,
    queueNames : [ 'A', 'B' ],
    queueCosts : { "A": 0.50, 'B': 0.00 },
    sequence : { 0: {name:"experiment", "rounds":2, "stages" : 1 }, 1: {name:"done", "rounds":1, "stages" : 1 } },
    //sequence : { 0: {name:"quiz", "rounds":1 }, 1: {name:"experiment", "rounds":2 }, 2: {name:"survey", "rounds":1 } },
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


