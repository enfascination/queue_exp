/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';
import { Schemas } from './schemas.js';
import { QuestionData } from '../../imports/startup/experiment_prep_instpref.js';
//import { Questions } from '../../imports/startup/server/server_prep.js';

DesignSequence = {
        "instructions" : {
            "name" : "instructions", 
            "type" : "instructions" , 
            "id" : "instructions" , 
            "label" : "Instructions" , 
            "roundCount" : 1, 
            "rounds" : {},
            "stages" : 1 ,
        }, 
        "quiz" : { 
            "name" : "quiz", 
            "type" : "quiz" , 
            "id" : "quiz" , 
            "label" : "Quiz" , 
            "roundCount" : 1, 
            "rounds" : {},
            "stages" : 1 ,
            "shuffledQuestions" : false,
        },
		// BJM
		"training" : { 
            "name" : "training", 
            "type" : "training" , 
            "id" : "training" , 
            "label" : "Training" , 
            "roundCount" : 2, 
            "rounds" : { "0" : {id:"round0", label:"Practice"},  "1" : {id:"round1", label:"Feedback"}},
            "stages" : 1 ,
            "shuffledQuestions" : false,
        }, 
		//BJM
        "experiment1" : { 
            "name" : "experiment1" , 
            "type" : "experiment" , 
            "id" : "experiment1" , 
            "label" : "Section 1" , 
            //"roundCount" : 3, 
            "roundCount" : 5, 
            "rounds" : { "0" : {id:"round0", label:"Game 1"},  "1" : {id:"round1", label:"Game 2"},  "2" : {id:"round2", label:"Feedback"},  "3" : {id:"round3", label:"Compare"},  "4" : {id:"round4", label:"Game 3"}, },
            "stages" : 1 ,
        }, 
        "experiment2" : {
            "name" : "experiment2" , 
            "type" : "experiment" , 
            "id" : "experiment2" , 
            "label" : "Section 2" , 
            //"roundCount" : 3, 
            "roundCount" : 5, 
            "rounds" : { "0" : {id:"round0", label:"Game 1"},  "1" : {id:"round1", label:"Game 2"},  "2" : {id:"round2", label:"Feedback"},  "3" : {id:"round3", label:"Compare"},  "4" : {id:"round4", label:"Game 3"}, },
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
    earnings : {
        HIT : 0.10,
        quiz : 0.40,
        survey : 0.20,
        point : 0.10,
        maxPoint : 0.30,
        maxExperiment : 1.80, //3*0.10*3*2 (max of three points, in three games, in each of two sections)
        minBonus : 0.60, // 0.40 + 0.20
        maxBonus : 2.40, // 0.40 + 0.20 + 3*0.15*3*2
    },
    //experimentDuration : "10-15",
    maxQuizFails : 3,
    maxExperimentReps : 10,
    sequence : DesignSequence,
    //sampleGame : [2,0,3,1,2,0,3,1], //not actulaly being used anywhere
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
if (false) {
    Debugging = true;
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
