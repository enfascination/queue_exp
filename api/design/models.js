/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';
import { Schemas } from './schemas.js';

DesignSequence = {
        "instructions" : { 
            "name" : "instructions", 
            "type" : "quiz" , 
            "id" : "instructions" , 
            "label" : "Instructions" , 
            "roundCount" : 0, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"}, },
            "stages" : 1,
        }, 
        "quiz" : { 
            "name" : "quiz", 
            "type" : "quiz" , 
            "id" : "quiz" , 
            "label" : "Start" , 
            "roundCount" : 1, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"}, },
            "stages" : 1 ,
            "shuffledQuestions" : true,
        }, 
        "experiment1" : { 
            "name" : "experiment1" , 
            "type" : "experiment" , 
            "id" : "experiment1" , 
            "label" : "Section 1" , 
            "roundCount" : 2, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"},  "1" : {id:"round1", label:"Round 1"}, },
            "stages" : 1 ,
        }, 
        "experiment2" : {
            "name" : "experiment2" , 
            "type" : "experiment" , 
            "id" : "experiment2" , 
            "label" : "Section 2" , 
            "roundCount" : 2, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"},  "1" : {id:"round1", label:"Round 1"}, },
            "stages" : 1 ,
        }, 
        "survey" : { 
            "name" : "survey", 
            "type" : "experiment" , 
            "id" : "survey" , 
            "label" : "Survey" , 
            "roundCount" : 1, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"}, },
            "stages" : 1 },
        "submitHIT" : { 
            "name" : "submitHIT", 
            "type" : "submitHIT" , 
            "id" : "submitHIT" , 
            "label" : "Submit" , 
            "roundCount" : 0, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"}, },
            "stages" : 0 
        },
    };
Design = {
    maxPlayersInCohort : 2,
    endowment : 1.00,
    pot : 1.00,
    queueNames : [ 'A', 'B' ],
    queueCosts : { "A": 0.50, 'B': 0.00 },
    maxQuizFails : 40,
    sequence : DesignSequence,
    positionCosts : 0.25,
    batchName : "main",
    matching : {
        ensureSubjectMismatchAcrossSections : false,
        ensureSubjectMatchAcrossSections : false,
        selfMatching : false,//DANGER lots of bad broken useless code in the relevant if statements
        noMatching : false,
    },
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


