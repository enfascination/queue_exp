/*jshint esversion: 6 */

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
        type: SimpleSchema.Integer,
        label: "experiment earnings",
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
    // this is the TurkServer asstId. 
        // it's the finest grain one and the one I shoudl use in data nalayssi.
    userId: {
        type: String,
        label: "User",
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
    "timestamps.choiceAdded": {
        type: Date,
        label: "Timestamps",
    },
    "timestamps.gameConsummated": {
        type: Date,
        label: "Timestamps",
        optional: true
    },
});

Schemas.CohortSettings = new SimpleSchema({
    cohortId: {
        type: SimpleSchema.Integer,
        label: "group number",
    },
    filledCohort: {
        type: Boolean,
        label: "count people in cohort",
    }, 
    completed: {
        type: Boolean,
        label: "completed cohort?",
    }, 
    matchable: {
        type: Boolean,
        label: "cohort half done?",
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
    sec_type: {
        type: String,
        label: "section type",
    },
    playerOne : {
        type: String,
        label: "player one",
    },
    playerTwo : {
        type: String,
        label: "player two",
        optional : true,
    }
});


Schemas.ExperimentAnswers = new SimpleSchema({
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
Schemas.SurveyAnswers = new SimpleSchema({
    questionType: {
        type: String,
        label: "Type of survey question",
    },
    text: {
        type: String,
        label: "long question",
        optional: true,
    },
    label: {
        type: String,
        label: "question",
    },
    answered: {
        type: Boolean,
        label: "answered",
    },
    choice: {
        type: String,
        label: "answer",
        optional: true,
    },
    hasError: {
        type: Boolean,
        label: "not correct",
    },
});
Schemas.QuizAnswers = new SimpleSchema({
    answered: {
        type: Boolean,
        label: "question answered",
    },
    correct: {
        type: Boolean,
        label: "answered correct",
    },
    choice: {
        type: String,
        label: "answer selected",
    },
    hasError: {
        type: Boolean,
        label: "not correct",
    },
});
Schemas.ExitSurveyAnswers = new SimpleSchema({
    feedback: {
        type: String,
        label: "feedback",
        optional: true,
    },
});
