/*jshint esversion: 6 */

var _ = require('lodash');

export let Schemas = {};

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
    "quiz.passed": { // pass and fail are not opposites during the quiz, but they are for the rest of the experiment
        type: Boolean,
        label: "Passed quiz",
    },
    "quiz.failed": {
        type: Boolean,
        label: "failed quiz",
    },
    "quiz.triesLeft": {
        type: SimpleSchema.Integer,
        label: "Attempts at quiz",
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
        type: String,
        label: "current section",
    },
    sec_type_now: {
        type: String,
        label: "current section type",
    },
    sec_rnd_now: {
        type: SimpleSchema.Integer,
        label: "current round",
    },
    sec_rnd_stg_now: {
        type: SimpleSchema.Integer,
        label: "current stage",
    },
    readyToProceed: {
        type: Boolean,
        label: "completed major section?",
    },
    totalEarnings: {
        type: Number,
        label: "experiment earnings",
        decimal: true,
    },
    cohort_now: {
        type: SimpleSchema.Integer,
        label: "current cohorts",
    },
    cohortIds: {
        type: [SimpleSchema.Integer],
        label: "cohorts this subject is a member of, in order",
    },
    treatments: {
        type: [String],
        label: "subject's ordered section treatments",
    },
    treatment_now: {
        type: String,
        label: "subject's treatment",
    },
    block_now: {
        type: SimpleSchema.Integer,
        label: "current block(section int)",
    },
    "HITStatus.gamesPlayed": {
        type: SimpleSchema.Integer,
        label: "Total number of payable games with answers by player",
        optional: true,
    },
    "HITStatus.gamesConsummated": {
        type: SimpleSchema.Integer,
        label: "Total number of payable games consummated",
        optional: true,
    },
    isExperienced : {
        type: Boolean,
        label: "has played before?",
    },
});

Schemas.SubjectsData = new SimpleSchema({
    mtWorkerId: {
        type: String,
        label: "turkUser",
    },
    // this is the TurkServer asstId. 
        // it's the finest grain one and the one I shoudl use in data nalayssi.
    asstUserId: {
        type: String,
        label: "asst User",
    },
    // this is the Meteor.userId ( and the asst.userId ) for identifying user in-game. 
    meteorUserId: {  // with better hygeine, this wouldn't be in this collection
        type: String,
        label: "Meteor User",
    },
    sec: {
        type: String,
        label: "gross section of the experiment",
    },
    sec_rnd: {
        type: SimpleSchema.Integer,
        label: "round in the section",
    },
    sec_type: {
        type: String,
        label: "section type",
    },
    cohortId: {
        type: SimpleSchema.Integer,
        label: "group number",
    },
    theData: {
        type: Object,
        label: "the data, in whichever section's format",
        blackbox: true,
    },
    theDataConsummated: {
        type: Object,
        label: "the data, in whichever section's format",
        blackbox: true,
        optional: true
    },
    completedChoice: {
        type: Boolean,
        label: "completed round?",
    }, 
    consummatedChoice: {
        type: Boolean,
        label: "game completed?",
        optional: true
    }, 
    "timestamps.choiceLoaded": {
        type: Number,
        label: "choiceLoaded",
        optional: true,
    },
    "timestamps.choiceMade": {
        type: Number,
        label: "choiceMade",
        optional: true,
    },
    "timestamps.choiceSubmitted": {
        type: Number,
        label: "choiceSubmitted",
        optional: true,
    },
    "timestamps.choiceAdded": {
        type: Number,
        label: "choiceAdded",
    },
    "timestamps.gameConsummated": {
        type: Number,
        label: "gameConsummated",
        optional: true,
    },
});

Schemas.CohortSettings = new SimpleSchema({
    cohortId: {
        type: SimpleSchema.Integer,
        label: "group number",
    },
    completed: {
        type: Boolean,
        label: "completed cohort?",
    }, 
    matchable: {
        type: Boolean,
        label: "cohort half done?",
    }, 
    "matching.ensureSubjectMismatchAcrossSectionsAndPreferentiallyCloseOutIncompleteCohorts": { // pass and fail are not opposites during the quiz, but they are for the rest of the experiment
        type: Boolean,
        label: "special mismatch flag",
    },
    "matching.ensureSubjectMismatchAcrossSections": {
        type: Boolean,
        label: "mismatch flag",
    },
    "matching.ensureSubjectMatchAcrossSections": {
        type: Boolean,
        label: "match flag",
    },
    "matching.selfMatching": {
        type: Boolean,
        label: "selfMatching flag",
    },
    "matching.noMatching": {
        type: Boolean,
        label: "nomatching flag",
    },
    maxQuizFails: {
        type: SimpleSchema.Integer,
        label: "maxQuizFails",
    },
    maxPlayersInCohort: {
        type: SimpleSchema.Integer,
        label: "Max size of cohort",
    },
    endowment: {
        type: Number,
        label: "Initial earnings",
        decimal: true,
    },
    sequence: {
        type: Object,
        label: "sequence of the experiment",
        blackbox: true,
    },
    batchName: {
        type: String,
        label: "batchName",
    },
    sec_type: {
        type: String,
        label: "section type",
    },
    filledCohort: {
        type: SimpleSchema.Integer,
        label: "count people in cohort",
    }, 
    playerOne : {
        type: String,
        label: "player one",
    },
    playerTwo : {
        type: String,
        label: "player two",
        optional : true,
    },
    surveyEarnings : {
        type: Number,
        label: "surveyEarnings",
        decimal: true,
    },
    pointEarnings : {
        type: Number,
        label: "pointEarnings",
        decimal: true,
    },
    subjectTreatmentsTemplate : {
        type: [String],
        label: "experimentTreatmentsTemplate",
    },
    tutorialEnabled: {
        type: Boolean,
        label: "tutorialEnabled",
    }, 
});

let questionsCore = {
    _id : {
        type: String,
        label: "q._id",
        optional: true, ///beause this is sometimes checked before objects have an id
    },
    sec : {
        type: String,
        label: "section of the experiment",
    },
    sec_rnd : {
        type: SimpleSchema.Integer,
        label: "round in the section",
    },
    sec_label : {
        type: String,
        label: "html name of section",
    },
    type : {
        type: String,
        label: "type of question",
    },
    label : {
        type: String,
        label: "description of the question",
    },
    choice: {
        type: String,
        label: "answer selected",
        optional: true,
    },
    answered: {
        type: Boolean,
        label: "question answered",
    },
    hasError: {
        type: Boolean,
        label: "not correct",
    },
    disabled: {
        type: Boolean,
        label: "disable questions",
    },
    order : {
        type: SimpleSchema.Integer,
        label: "order of question",
    },
    meteorUserId: {
        type: String,
        label: "Meteor User",
    },
};

Schemas.ExperimentAnswers = new SimpleSchema( 
    _.concat( questionsCore, {
    title : {
        type: String,
        label: "title of the question",
    },
    text : {
        type: String,
        label: "text of the question",
    },
    strategic: {
        type: Boolean,
        label: "did the question integrate another persons choices",
    },
    paid: {
        type: Boolean,
        label: "does this question pay?",
    },
    cohortId: {  
        type: SimpleSchema.Integer,
        label: "group number",
    },
    mtWorkerId: {
        type: String,
        label: "MT Worker Id",
    },
    treatment : {
        type: String,
        label: "treatment",
    },
    payoffOrder: { //['Top,Left', 'Top,Right', 'Bottom,Left', 'Bottom,Right'];
        type: [String],
        label: "payoffOrder",
    },
    payoffOrderPlayers: { //['You', 'Other'];
        type: [String],
        label: "payoffOrderPlayers",
    },
    playerPosition: { 
        type: String,
        label: "playerPosition",
    },
    payoffs: { 
        type: [SimpleSchema.Integer],
        label: "payoffs",
        optional: true,
        //decimal: true,  change to number if I ever want decimenals in payoffs
    },
    payoffsGame1: { 
        type: [SimpleSchema.Integer],
        label: "payoffsGame1",
    },
    payoffsGame2: { 
        type: [SimpleSchema.Integer],
        label: "payoffsGame2",
    },
    payoffsDiff: { 
        type: [SimpleSchema.Integer],
        label: "payoffsDiff",
    },
    matchingGameId: { 
        type: String,
        label: "matchingGameId",
        optional: true,
    },
    idGameQ1: { 
        type: String,
        label: "idGameQ1",
        optional: true,
    },
    idGameQ2: { 
        type: String,
        label: "idGameQ2",
        optional: true,
    },
    // optional values added after consummation
    outcome : {
        type: String,
        label : "outcome",
        optional: true,
    },
    outcomeFocal : {
        type: String,
        label : "outcomeFocal",
        optional: true,
    },
    outcomeOther : {
        type: String,
        label : "outcomeOther",
        optional: true,
    },
    payoffEarnedFocal: { 
        type: SimpleSchema.Integer,
        label: "payoffEarnedFocal",
        optional: true,
    },
    payoffEarnedOther: { 
        type: SimpleSchema.Integer,
        label: "payoffEarnedOther",
        optional: true,
    },
    completedGame: {
        type: Boolean,
        label: "completedGame",
        optional: true,
    }, 
    choiceLoadedTime: {
        type: Number,
        label: "choiceLoadedTime",
        optional: true,
    },
    choiceMadeTime: {
        type: Number,
        label: "choiceMadeTime",
        optional: true,
    },
    choiceSubmittedTime: {
        type: Number,
        label: "choiceSubmittedTime",
        optional: true,
    },
}) );

Schemas.QuizAnswers = new SimpleSchema(
    _.concat( questionsCore, {
    title : {
        type: String,
        label: "title of the question",
    },
    text : {
        type: String,
        label: "text of the question",
    },
    payoffs: { 
        type: [SimpleSchema.Integer],
        label: "payoffs",
        //decimal: true,  change to number if I ever want decimenals in payoffs
    },
    options: {
        type: [String],
        label: "potential answers to the quiz",
    },
    correct: {
        type: Boolean,
        label: "correct",
    },
    correctAnswer: {
        type: [String],
        label: "correct answer(s) to the quiz",
    },
} ));
Schemas.SurveyAnswers = new SimpleSchema(
    _.concat( questionsCore, {
    options: {
        type: [String],
        label: "potential answers to the quiz",
        optional : true,
    },
    pattern: {
        type: String,
        label: "pattern",
        optional : true,
    },
    fieldName: {
        type: String,
        label: "fieldName",
        optional : true,
    },
} ));
Schemas.ExitSurveyAnswers = new SimpleSchema({
    feedback: {
        type: String,
        label: "feedback",
        optional: true,
    },
});
