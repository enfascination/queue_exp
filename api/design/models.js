/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';
import { Schemas } from './schemas.js';

Design = {
    maxPlayersInCohort : 2,
    endowment : 1.00,
    pot : 1.00,
    queueNames : [ 'A', 'B' ],
    queueCosts : { "A": 0.50, 'B': 0.00 },
    maxQuizFails : 2,
    //sequence : { 0: {name:"experiment", "rounds":1, "stages" : 1 }, 1: {name:"done", "rounds":1, "stages" : 1 } },
    //sequence : { 0: {name:"quiz", "rounds":1 }, 1: {name:"experiment", "rounds":2 }, 2: {name:"survey", "rounds":1 } },
    sequence : { 
        "quiz" : { "name" : "quiz", "rounds":1, "stages" : 1 }, 
        "experiment" : { "name" : "experiment" , "rounds":1, "stages" : 1 }, 
        "survey" : { "name" : "survey", "rounds":1, "stages" : 1 },
        "submitHIT" : { "name" : "submitHIT", "rounds":0, "stages" : 0 },
    },
    positionCosts : 0.25,
    batchName : "main",
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


