/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';
import { Schemas } from './schemas.js';

DesignSequence = { 
        "instructions" : { 
            "name" : "instructions", 
            "type" : "quiz" , 
            "id" : "instructions" , 
            "label" : "Instructions" , 
            "rounds" : 0, 
            "stages" : 1 
        }, 
        "quiz" : { 
            "name" : "quiz", 
            "type" : "quiz" , 
            "id" : "quiz" , 
            "label" : "Start" , 
            "rounds" : 1, 
            "stages" : 1 
        }, 
        "experiment1" : { 
            "name" : "experiment1" , 
            "type" : "experiment" , 
            "id" : "experiment1" , 
            "label" : "Experiment:\nPart 1" , 
            "rounds" : 2, 
            "stages" : 1 
        }, 
        "experiment2" : {
            "name" : "experiment2" , 
            "type" : "experiment" , 
            "id" : "experiment2" , 
            "label" : "Experiment:\nPart 2" , 
            "rounds" : 2, 
            "stages" : 1 
        }, 
        "survey" : { 
            "name" : "survey", 
            "type" : "experiment" , 
            "id" : "survey" , 
            "label" : "Survey" , 
            "rounds" : 1, 
            "stages" : 1 },
        "submitHIT" : { 
            "name" : "submitHIT", 
            "type" : "submitHIT" , 
            "id" : "submitHIT" , 
            "label" : "Submit" , 
            "rounds" : 0, 
            "stages" : 0 
        },
    };
Design = {
    maxPlayersInCohort : 2,
    endowment : 1.00,
    pot : 1.00,
    queueNames : [ 'A', 'B' ],
    queueCosts : { "A": 0.50, 'B': 0.00 },
    maxQuizFails : 2,
    //sequence : { 0: {name:"experiment", "rounds":1, "stages" : 1 }, 1: {name:"done", "rounds":1, "stages" : 1 } },
    //sequence : { 0: {name:"quiz", "rounds":1 }, 1: {name:"experiment", "rounds":2 }, 2: {name:"survey", "rounds":1 } },
    sequence : DesignSequence,
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


