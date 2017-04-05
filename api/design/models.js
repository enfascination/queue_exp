/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';
import { Schemas } from './schemas.js';
import { QuestionData } from '../../imports/startup/experiment_prep_instpref.js';
//import { Questions } from '../../imports/startup/server/server_prep.js';

DesignSequence = {
        "quiz" : { 
            "name" : "quiz", 
            "type" : "quiz" , 
            "id" : "quiz" , 
            "label" : "Start" , 
            "roundCount" : 1, 
            "rounds" : { "0" : {id:"round0", label:"Round 0"}, },
            "stages" : 1 ,
            "shuffledQuestions" : false,
        }, 
        "experiment1" : { 
            "name" : "experiment1" , 
            "type" : "experiment" , 
            "id" : "experiment1" , 
            "label" : "Section 1" , 
            //"roundCount" : 3, 
            //"rounds" : { "0" : {id:"round0", label:"Round 1"},  "1" : {id:"round1", label:"Round 2"},  "2" : {id:"round2", label:"Feedback"}, },
            "roundCount" : 5, 
            "rounds" : { "0" : {id:"round0", label:"Round 1"},  "1" : {id:"round1", label:"Round 2"},  "2" : {id:"round2", label:"Feedback"},  "3" : {id:"round3", label:"Round 3"},  "4" : {id:"round4", label:"Round 4"}, },
            "stages" : 1 ,
        }, 
        "experiment2" : {
            "name" : "experiment2" , 
            "type" : "experiment" , 
            "id" : "experiment2" , 
            "label" : "Section 2" , 
            //"roundCount" : 3, 
            //"rounds" : { "0" : {id:"round0", label:"Round 1"},  "1" : {id:"round1", label:"Round 2"},  "2" : {id:"round2", label:"Feedback"}, },
            "roundCount" : 5, 
            "rounds" : { "0" : {id:"round0", label:"Round 1"},  "1" : {id:"round1", label:"Round 2"},  "2" : {id:"round2", label:"Feedback"},  "3" : {id:"round3", label:"Round 3"},  "4" : {id:"round4", label:"Round 4"}, },
            "stages" : 1 ,
        }, 
        "survey" : { 
            "name" : "survey", 
            "type" : "experiment" , 
            "id" : "survey" , 
            "label" : "Survey" , 
            "roundCount" : 1, 
            "rounds" : { "0" : {id:"round0", label:"Questions"}, },
            "stages" : 1 },
        "earningsReport" : { 
            "name" : "earningsReport", 
            "type" : "experiment" , 
            "id" : "earningsReport" , 
            "label" : "Earnings" , 
            "roundCount" : 0, 
            "rounds" : { "0" : {id:"round0", label:"Earnings report"}, },
            "stages" : 0 
        },
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
    surveyEarnings : 0.50,
    pointEarnings : 0.25,
    maxQuizFails : 3,
    sequence : DesignSequence,
    //sampleGame : [1,-1,2,0,1,-1,2,0], //not actulaly being used anywhere
    batchName : "main",
    matching : {
        ensureSubjectMismatchAcrossSections : false,
        ensureSubjectMismatchAcrossSectionsAndPreferentiallyCloseOutIncompleteCohorts : true,
        ensureSubjectMatchAcrossSections : false,
        selfMatching : false,
        noMatching : false,
    },
    // think of these as subject level, not cohort level. 
    //     in a cohort, you get both within a cohort
    subjectTreatmentsTemplate : ["nofeedback", "feedback"], 
    tutorialEnabled : true,
};

UserElements = {
    experimenterView : false,
};

Debugging = false;
if (Debugging) {
    SimpleSchema.debug = true;
    UserElements.experimenterView = true;
    Design.tutorialEnabled = false;
}

SubjectsData = new Mongo.Collection('s_data');
SubjectsStatus = new Mongo.Collection('s_status');
SubjectsStatusArchive = new Mongo.Collection('s_status_bak');
SubjectsData.attachSchema(Schemas.SubjectsData);
SubjectsStatus.attachSchema(Schemas.SubjectsStatus);
SubjectsStatusArchive.attachSchema(Schemas.SubjectsStatus);
CohortSettings = new Mongo.Collection('designs');
CohortSettings.attachSchema(Schemas.CohortSettings);
Questions = new Mongo.Collection( 'questions' );
//TurkServer.partitionCollection(CohortSettings);
