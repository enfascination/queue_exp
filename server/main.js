/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';

import '../api/design/models.js';
import { Schemas } from '../api/design/schemas.js';
import { Helper } from '../imports/lib/helper.js';

import { OverlapAssigner } from './assigners-custom.js';

import { Experiment } from './exp_instpref.js';
import { QuestionData } from '../imports/startup/experiment_prep_instpref.js';

if ( Debugging && ( (Meteor.absoluteUrl() === 'https://localhost') || (Meteor.absoluteUrl() === 'http://localhost') || (Meteor.absoluteUrl() === 'http://localhost:3000/') ) ) {
    //SSL('/Users/sfrey/projecto/research_projects/instpref/instpref/private/local/server.key','/Users/sfrey/projecto/research_projects/instpref/instpref/private/local/server.crt', 443);
}

//console.log("Testing", process.env.HOME );

// https://dweldon.silvrback.com/common-mistakes
//
Meteor.users.deny({
      update: function() {
              return true;
            }
});

    Meteor.startup(function () {
        Batches.upsert({name: Design.batchName }, {name: Design.batchName , active: true});
        let batch = TurkServer.Batch.getBatchByName( Design.batchName );
        //batch.setAssigner(new TurkServer.Assigners.SimpleAssigner());
        batch.setAssigner( new OverlapAssigner() );
    });

    TurkServer.initialize( function() {
    });

    Meteor.publish('s_data_full', function() {
        return SubjectsData.find({}, { sort : { sec : -1, sec_rnd : -1 } } );
    });
    Meteor.publish('s_status_full', function() {
        return SubjectsStatus.find();
    });
    Meteor.publish('s_data', function() {
        let sub = SubjectsStatus.findOne({ meteorUserId : this.userId });
        if (sub) {
            return SubjectsData.find({ meteorUserId: this.userId, mtAssignmentId : sub.mtAssignmentId }, { sort : { sec : -1, sec_rnd : -1 } });
        }
    });
    Meteor.publish('s_status', function() {
        //if ( UserElements.experimenterView || TurkServer.isAdmin() ) {
            //return SubjectsStatus.find();
        //} else {
        if (this.userId) {
            //console.log("publishing", this.userId);
            return SubjectsStatus.find({ meteorUserId: this.userId });
        } else {
            //return SubjectsStatus.find();
        }
    });
    Meteor.publish('designs', function() {
        return CohortSettings.find( {}, { sort : { cohortId : -1 } } );
    });
    Meteor.publish('questions', function() {
        let sub = SubjectsStatus.findOne({ meteorUserId : this.userId });
        if (sub) {
            return Questions.find({ meteorUserId: this.userId, mtAssignmentId : sub.mtAssignmentId  });
        }
    });

    Meteor.methods({
        // this is a reload detector.  if the player has connected before, they will have a non-zero current cohort.
        // FORMERLY: this is a reload detector.  if the player has connected before, they will have a data object in progress.
        playerHasConnectedBefore: function( muid ) {
            //console.log("check prior (data) connections",SubjectsStatus.findOne({meteorUserId : muid}),  SubjectsData.find({meteorUserId : muid}, { $sort: {sec : -1, sec_rnd : -1 }}).fetch() );
            let playerHasConnectedBefore = false;//, playerReconnectingMidSection = false, playerReconnectingEndSection = false;
            let subStat = SubjectsStatus.findOne( { meteorUserId : muid } );
            playerHasConnectedBefore     = (subStat.cohort_now !== 0) ? true : false;
            //let subjectDatas = SubjectsData.find( { meteorUserId : muid, sec : subStat.sec_now } );
            //playerReconnectingMidSection = playerHasConnectedBefore && _.some( subjectDatas.map( (x)=>!x.completedChoice) );
            //playerReconnectingEndSection = playerHasConnectedBefore && _.every( subjectDatas.map( (x)=>x.completedChoice) );
            //console.log("testrelogon", muid, SubjectsData.find({meteorUserId : muid, completedChoice : false}).fetch(), subjectDatas );
            return( { 
                //"subStat" : subStat, 
                //"data" : subjectDatas,  // this was unused and may have been impeding performance on section initializing
                "playerHasConnectedBefore" : playerHasConnectedBefore, 
                //"playerReconnectingMidSection" : playerReconnectingMidSection,
                //"playerReconnectingEndSection" : playerReconnectingEndSection,
            } );
        },
        // this will createa a new SubjectsStatus object
        initializeSubject: function( idObj, design ) {
           
            // has this turker done my experiment before?
            let isExperienced = SubjectsStatusArchive.find(
                    { 
                        mtWorkerId : idObj.workerId, 
                        completedExperiment: true, 
                    }
                ).count();

            // experiment-specific logic
            //    assign sub to treatments depending on matching protocol 
            //    that design is based on
            let treatments;
            if (design.matching.selfMatching) {
                treatments = design.subjectTreatmentsTemplate;
            } else if (
                    design.matching.ensureSubjectMismatchAcrossSectionsAndPreferentiallyCloseOutIncompleteCohorts && 
                    ( isExperienced > 0 )
                ) {
                treatments = ['feedback','feedback'];
            } else if (
                    design.matching.ensureSubjectMismatchAcrossSections ||
                    design.matching.ensureSubjectMismatchAcrossSectionsAndPreferentiallyCloseOutIncompleteCohorts 
                ) {
                treatments = _.shuffle( design.subjectTreatmentsTemplate );
            } else if (design.matching.noMatching ) {
                treatments = ['nofeedback','nofeedback'];
            }

            SubjectsStatus.insert( {
                meteorUserId: idObj.userId,
                quiz: {"passed" : false, "failed" : false, "triesLeft" : design.maxQuizFails },
                completedExperiment: false,
                tsAsstId: idObj.asstId,
                tsBatchId: idObj.batchId,
                tsGroupId: "undefined",
                mtHitId: idObj.hitId,
                mtAssignmentId: idObj.assignmentId,
                mtWorkerId: idObj.workerId,
                cohort_now : 0,
                cohortIds : [],
                sec_now: 'instructions',
                sec_type_now: 'instructions',
                sec_rnd_now: 0,
                sec_rnd_stg_now: 0,
                readyToProceed: false,
                totalEarnings: 0,
                treatments : treatments,
                treatment_now : treatments[0],
                block_now : 0,  // this is an int version of sec_now
                isExperienced : isExperienced,
            } );

            //ensure uniqueness
            SubjectsStatus._ensureIndex({ meteorUserId : 1}, { unique : true } );
        },
        addSectionQuestions : function( sub, sec, design) {
            //import { QuestionData } from '../../imports/startup/experiment_prep_instpref.js';
            //let idxs = _.shuffle( _.range( questions.length ) );
            //console.log("addQuestions", sec, matching, sub.cohort_now, sub.sec_now, sub.sec_rnd_now, sub);
            //console.log("addQuestions", sec, sub.cohort_now, sub.sec_now, sub.sec_rnd_now);
            let initializeGame = function initializeGame(sub, sec) {
                let payoffsGame1, payoffsGame2, payoffsDiff = _.times(8,()=>0);
                let payoffOrder = ['Top,Left', 'Top,Right', 'Bottom,Left', 'Bottom,Right'];
                let payoffOrderPlayers = ['You', 'Other'];
                let playerPosition = "Side";
                if (sec === "experiment1" || sec === "experiment2") {
                    if ( sub.treatment_now === "nofeedback" ) {
                        /// game 1
                        // strictly ordinal games (without replacement)
                        payoffsGame1 = Helper.generateGame( maxPayoff = 3);
                        // loosely ordinal games (with replacement)
                        //let payoffs = _.concat( _.times(4, ()=>_.sample([1, 2, 3, 4]) ), _.times(4, ()=>_.sample([1, 2, 3, 4]) ) );
                        /// game 2
                        payoffsGame2 = Helper.tweakGame( payoffsGame1, switchOnly=true, maxPayoff = 3 );
                        if( _.random() === 0 ) { // another shuffle that is important to make sure doubles happen in both blocks
                            let tmp = _.clone( payoffsGame1 );
                            payoffsGame1 = _.clone( payoffsGame2 );
                            payoffsGame2 = tmp;
                        }
                        console.log("generated games", payoffsGame1, payoffsGame2);
                    } else if ( sub.treatment_now === "feedback" ) {
                        let previousQuestion = Questions.findOne({ cohortId : sub.cohort_now, sec_rnd : sub.sec_rnd_now, strategic : true});
                        //console.log("returning to games1", previousQuestion);

                        payoffsGame1 = Helper.pivotGame( previousQuestion.payoffsGame1 );
                        payoffsGame2 = Helper.pivotGame( previousQuestion.payoffsGame2 );
                        console.log("returning to games", payoffsGame1, payoffsGame2);
                    }
                    payoffsDiff = _.map( _.zip(payoffsGame1, payoffsGame2), (e)=> _.subtract(e[1], e[0]) );
                }
                return({
                    payoffOrder : payoffOrder, 
                    payoffOrderPlayers : payoffOrderPlayers, 
                    playerPosition : playerPosition, 
                    payoffsGame1 : payoffsGame1,
                    payoffsGame2 : payoffsGame2,
                    payoffsDiff : payoffsDiff,
                });
            };
            let gameData = initializeGame(sub, sec);
            let payoffOrder = gameData.payoffOrder;
            let payoffOrderPlayers = gameData.payoffOrderPlayers;
            let playerPosition = gameData.playerPosition;
            let payoffsGame1 = gameData.payoffsGame1;
            let payoffsGame2 = gameData.payoffsGame2;
            let payoffsDiff = gameData.payoffsDiff;
            let idGameQ1, idGameQ2, idTmp;
            // questionsdata object is a client side collection whose 
            //    questions get initialized, added to serverside, and 
            //    integrated into experiment flow in this loop 
            //console.log("addQuestions, really", sec, design);
            //console.log("addQuestions, really", sec, design['sequence']);
            //console.log("addQuestions, really", sec, Object.values( design ) );
            //console.log("addQuestions, really", sec, Object.keys( design.sequence ));
            QuestionData.questions.forEach( function(q) {
                if ( q.sec === sec && 
                    q.sec_rnd < design.sequence[sec].roundCount ) {
                    //console.log("addQuestions q", sec, q.sec, q.sec_rnd, sub.cohort_now);
                    q.meteorUserId = sub.meteorUserId;
                    q.mtAssignmentId = sub.mtAssignmentId; 
                    if (q.sec === 'experiment1' || q.sec === 'experiment2' ) {
                        //q._id doesn't exist yet here.  insert happens below
                        q.sec = sec; // overwrite the input section (from experiment to experiment1)
                        q.cohortId = sub.cohort_now;
                        // important forq's to know both meteor id and mt id, to 
                        // avoid matching peope with themselves when they later 
                        // reaccet the hit
                        q.mtWorkerId = sub.mtWorkerId; 
                        q.treatment = sub.treatment_now;
                        q.payoffOrder = payoffOrder;
                        q.payoffOrderPlayers = payoffOrderPlayers;
                        q.playerPosition = playerPosition;
                        q.payoffsGame1 = payoffsGame1;
                        q.payoffsGame2 = payoffsGame2;
                        q.payoffsDiff = payoffsDiff;
                        /// matching of matchable games
                        if (   
                                sub.treatment_now === "feedback" && // def try to match
                                q.type === 'chooseStrategy' &&      // which q's to match
                                q.strategic && 
                                _.includes([0,1,4], q.sec_rnd )     // which rounds to match in
                        ) {
                            let matchingQuestion = Questions.findOne(
                                { cohortId : q.cohortId, sec_rnd : q.sec_rnd, type : q.type, strategic : true}
                            );
                            if( matchingQuestion ) {
                                q.matchingGameId = matchingQuestion._id;
                                console.log( "create matched game: matching question", q._id, matchingQuestion._id );
                            } else {
                                q.matchingGameId = null;
                                console.log( "create matched game: no matching question", q._id, q.cohortId, q.sec_rnd, q.type);
                            }
                        } else {
                            q.matchingGameId = null;
                        }
                        if (q.sec_rnd === 0) {
                            q.payoffs = payoffsGame1;
                        } else if (q.sec_rnd === 1) {
                            q.payoffs = payoffsGame2;
                        } else if (q.sec_rnd === 2) {
                            // info round
                        } else if (q.sec_rnd === 3) {
                            q.idGameQ1 = idGameQ1;
                            q.idGameQ2 = idGameQ2;
                            q.payoffs = null;
                        } else if (q.sec_rnd === 4) {
                            q.payoffs = null;  // maybe i need to inititlize this key?
                        }
                    } 

                    /// add the q to the questions collection
                    try {
                        if ( sec === 'quiz' ) {
                            Schemas.QuizAnswers.validate( q );
                        } else if ( sec === 'survey' ) {
                            Schemas.SurveyAnswers.validate( q );
                        } else if ( sec === 'experiment1' || sec === 'experiment2' ) {
                            Schemas.ExperimentAnswers.validate( q );
                        }
                    } catch (err) {
                        console.log("ERROR 90DFUSIJK: Schema violation adding question", q, err);
                        throw(err);
                    }
                    idTmp = Questions.insert(q);
                    //console.log( "updating matches", idTmp, q.matchingGameId );
                    if (!_.isNil( idTmp ) && !_.isNil( q.matchingGameId ) ) {
                        Questions.update( q.matchingGameId, {$set : {matchingGameId : idTmp }});
                    }
                    // pass id to the neighboring 2afc game so I can choose between them
                    if (q.type === "chooseStrategy" && q.sec_rnd === 0) {
                        idGameQ1 = idTmp;
                    } else if (q.type === "chooseStrategy" && q.sec_rnd === 1) {
                        idGameQ2 = idTmp;
                    }
                    // some sanity checking (did the insert work)?
                    try {
                        console.assert(!_.isNil( idTmp ), "prob add'g q's");
                    } catch (err) {
                        console.log("Problem adding Questions", q);
                        throw(err);
                    }
                    //console.log("addQuestions q out");
                }
            });
            //console.log("addQuestions out");
        },
        // initialize cohort should always have been called before this function initializeRound
        // this will create a new SubjectsData object
        // it will update and may create a new CohortSettings object
        initializeSection: function( sub, lastDesign ) {
            //console.log("initRound beginning");
            let design, cohortId;

            if (_.isString(sub)) { 
                // sub can be passed as a collection or a meteor.userId()
                // but it should end up as a collection result
                sub = SubjectsStatus.findOne({meteorUserId:sub});
            }
            //console.log("initRound found sub");

            //  experiment specific
            // retrieve the appropriiate design for the subject in this state
            let tmpObj = Meteor.call("findSubsCohort", sub, lastDesign, Design.matching );
            cohortId = tmpObj.cohortId;
            treatment = tmpObj.treatment;
            //console.log("initRound found cohortId");

            //set subjects cohort_now to this cohortId and update from any 
            //changes to the treatment that happened while tryig to find a good cohort
            let treatmentsNew = sub.treatments;
            treatmentsNew[ sub.block_now ] = treatment;
            SubjectsStatus.update({meteorUserId : sub.meteorUserId},{$set : {
                cohort_now : cohortId,
                treatment_now : treatment,
                treatments : treatmentsNew,
            } });
            sub = SubjectsStatus.findOne({meteorUserId : sub.meteorUserId});
            //console.log("initRound reinit subject object");

            // init or update the cohort object that we're going to match this subject to
            //   then get updated version of the changed objects
            design = Meteor.call("initializeCohort", cohortId=cohortId, sub.meteorUserId);
            //console.log("initRound init cohort");

            // init this section by creating and adding all of its component 
            // questions, for all rounds;
            Meteor.call("addSectionQuestions", sub, sub.sec_now, design );
            //console.log("initRound added questions");


            let ss, sd, ct;
            ss = SubjectsStatus.findOne({ meteorUserId: sub.meteorUserId });
            ct = CohortSettings.findOne({ cohortId: design.cohortId});
            console.log("initRound done", cohortId, treatmentsNew, sub.mtWorkerId, sub.mtAssignmentId, sub.isExperienced);
            return( { "s_status" : ss, "s_data" : sd, "design" : ct } );
        },
        // this modfiies a SubjectsStatus object
        addGroupId: function( meteorUserId, groupId ) {
            if ("undefined" in SubjectsStatus.find({meteorUserId: meteorUserId}, { fields: {'tsGroupId':1} }).fetch()) {
                let res = SubjectsStatus.update({meteorUserId: meteorUserId}, { $set: {tsGroupId : groupId} });
                //console.log(res);
            }
        },
        // this updates a SubjectsStatus object
        advanceSubjectState : function(muid, lastRound) {

            if( !lastRound ) {
                let sub_old = SubjectsStatus.findOne({ meteorUserId: muid });
                //console.log("updating round");
                SubjectsStatus.update({meteorUserId: muid }, {
                    $set: {
                        //sec_now: next_section,
                        sec_rnd_now: sub_old.sec_rnd_now + 1,
                    },
                });
            }
            let sub = SubjectsStatus.findOne({ meteorUserId: muid });

            return( sub );
        },
        advanceSubjectSection : function(muid, nextSection, nextSectionType) {
            let sub_old = SubjectsStatus.findOne({ meteorUserId: muid });

            let entered = 0;

            SubjectsStatus.update({meteorUserId: muid }, {
                $set: {
                    sec_now: nextSection,
                    sec_type_now: nextSectionType,
                    sec_rnd_now: 0,
                    readyToProceed: false, // reset this for the next section
                },
            });

            //console.log("advanceSubjectSection", "unready", sub.readyToProceed );
            // routing, which can vary by section
            //if ( sub.sec_now != sub.sec_now ) {
            let asst = TurkServer.Assignment.getAssignment( sub_old.tsAsstId );
            let batch = TurkServer.Batch.getBatchByName( Design.batchName );
            if ( sub_old.sec_now === "instructions" ) {
                if ( nextSection === "quiz" ) {
                    TurkServer.setQuizState(asst);
                } else if ( nextSection === "submitHIT" ) {
                    asst.showExitSurvey();
                    Meteor.call('goToExitSurvey', Meteor.userId());
                }
            } else if ( sub_old.sec_now === "quiz" ) {
                // to experiment
                if ( nextSection === "experiment1" ) {
                    TurkServer.setLobbyState( asst, batch );
                    entered = 1;
                } else if ( nextSection === "submitHIT" ) {
                    asst.showExitSurvey();
                    Meteor.call('goToExitSurvey', Meteor.userId());
                }
            } else if ( sub_old.sec_now === "experiment1" || sub_old.sec_now === "experiment2" ) {
                // to survey
                //let asst = TurkServer.Assignment.getAssignment( sub_old.tsAsstId );
                //let batch = TurkServer.Batch.getBatchByName( Design.batchName );
                //TurkServer.setLobbyState( asst, batch );
                entered = 2;
                if ( sub_old.sec_now === "experiment1" ) {
                    SubjectsStatus.update({meteorUserId: muid }, {
                        $set: {
                            block_now: sub_old.block_now + 1,
                            treatment_now: sub_old.treatments[ sub_old.block_now + 1 ],
                        },
                    });
                }
            } else if ( sub_old.sec_now === "survey" ) {
                SubjectsStatus.update({ meteorUserId: muid }, {
                    $set: {
                        completedExperiment: true,
                    },
                });
                // the earningsReport section doesn't have a submit button, and should go straight to next
                Meteor.call("setReadyToProceed", muid);
                entered = 3;
            } else if ( sub_old.sec_now === "earningsReport" ) {
                // to exit survey/submitHIT
                //console.log("outside goToExitSurvey");
                Meteor.call('goToExitSurvey', Meteor.userId());
                entered = 4;
            }

            sub = SubjectsStatus.findOne({ meteorUserId: muid });
            //console.log("end of advancesection", entered, sub_old.sec_now , sub.sec_now );
            return( sub );
        },
        // updates a CohortSettings object
        tryToCompleteUncompletedQuestions: Experiment.tryToCompleteUncompletedQuestions,
        completeQuestionPair: Experiment.completeQuestionPair,
        completeGameCompare: Experiment.completeGameCompare,
        tryToCompleteCohort: Experiment.tryToCompleteCohort,
        findSubsCohort : Experiment.findSubsCohort,
        // updates a bunch of SubjectsData objects
        calculateExperimentEarnings : Experiment.calculateExperimentEarnings,
        updateExperimentEarnings : Experiment.updateExperimentEarnings,
        updateStatusInHIT : Experiment.updateStatusInHIT,
        goToExitSurvey: function( muid ) {
            sub = SubjectsStatus.findOne({meteorUserId : muid});
            console.log("goToExitSurvey", muid, sub.mtWorkerId, sub.mtAssignmentId);
            if (TurkServer.Instance.currentInstance()) {
                //console.log("goToExitSurvey in loop");
                TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
                //console.log("goToExitSurvey after loop");
            }
        },
        updateQuiz: function ( muid, quizObj) {
            //console.log("updateQuiz", sub);
            SubjectsStatus.update({ meteorUserId: muid }, 
                { $set: { quiz: quizObj } });
            return( quizObj );
        }, 
        setReadyToProceed: function (muid) {
            //console.log("setReadyToProceed fn");
            SubjectsStatus.update({ meteorUserId: muid }, 
                { $set: { "readyToProceed" : true } });
        },
        // this takes previous deisgn and increments on it, or takes nothign and makes firs deisgn on global
        // Creates a new CohortSettings object
        'initializeCohort': Experiment.initializeCohort,
        insertQuestionToSubData: function(muid, theData ) {
            let sub = SubjectsStatus.findOne({ meteorUserId : muid });
            //console.log("insertSurveyQuestion", sub);
            // fortify theData with vestiges
            if (sub.sec_now === 'experiment1' || sub.sec_now === 'experiment2') {
                theData.cohortId = sub.cohort_now;
            } else {
                theData.cohortId = 0;
            }

            let entry = {
                _id : theData._id,
                mtWorkerId: sub.mtWorkerId,
                mtAssignmentId: sub.mtAssignmentId,
                meteorUserId: sub.meteorUserId,
                sec: theData.sec,
                sec_type: sub.sec_type_now,
                sec_rnd: theData.sec_rnd,
                cohortId: theData.cohortId,
                theData: theData,
                completedChoice : true,
                timestamps : {
                    choiceLoaded : theData.choiceLoadedTime,
                    choiceMade : theData.choiceMadeTime,
                    choiceSubmitted : theData.choiceSubmittedTime,
                    choiceAdded : Date.now(),
                },
            };
            // insert
            let id = SubjectsData.insert( entry );
            try {
                SubjectsData._ensureIndex({
                    mtWorkerId : 1,
                    mtAssignmentId : 1, 
                    meteorUserId : 1, 
                    cohortId : 1, 
                    sec : 1, 
                    sec_rnd : 1, 
                    "theData.order" : 1,  //there can be multiple questions per section per round
                }, { unique : true } );
            } catch (err) {
                console.log("WARNING: Second D for double dose of pimping pleasure", entry, err );
            }
            return( entry );
        },
        // server side helper
        updateSubjectQuestion : function(muid, id, theData) {
            // with this try block, updateSubjectQuestion can only update 
            // all fo the field, not just a few fields like it was 
            // originally intended to do. 
            // But I like validation being server side
                    try {
                        if ( theData.sec === 'quiz' ) {
                            Schemas.QuizAnswers.validate( theData );
                        } else if ( theData.sec === 'survey' ) {
                            Schemas.SurveyAnswers.validate( theData );
                        } else if ( theData.sec === 'experiment1' || theData.sec === 'experiment2' ) {
                            Schemas.ExperimentAnswers.validate( theData );
                        }
                    } catch (err) {
                        console.log("ERROR 90DFUSIJK: Schema violation adding question", theData, err);
                        throw(err);
                    }
                let output = Questions.update({_id : id, meteorUserId : muid}, {$set : theData});
        },
        testErrors : Experiment.testErrors,
        disableQuestions : function(ids, reset) {
            ids.forEach( function(id) {
                let theUpdate = {disabled : true,};
                if (reset) {
                    theUpdate = {
                        disabled : true,
                        choice: null,
                        answered: false,
                        hasError: false,
                    };
                }
                Questions.update({_id: id}, {$set: theUpdate});
            });
        },
        // this is the function I use to set a game on the fly after it is chosen for the final round of play
        setChosenGameForRound : function(muid, treatment, sec, sec_rnd, chosenGameId ) {
            //console.log("setChosenGameForRound", sec_rnd, chosenGameId );
            let sub = SubjectsStatus.findOne({meteorUserId : Meteor.userId() });
            let chosenQuestion, nextQuestion, focalPlayersChoice = false, firstPlayersChoice = true;
            let tmp, tmp2;
            // first, what is the game object with the id of the choice of the choice between two games?
            chosenQuestion = Questions.findOne({ _id : chosenGameId });
            // then, what is the following pre-created question object to fill with entries from the game that was chosen above?
            nextQuestion = Questions.findOne({
                meteorUserId : muid, 
                mtAssignmentId : sub.mtAssignmentId,
                sec : sec, 
                sec_rnd : sec_rnd, 
                type : chosenQuestion.type,
                strategic : true});
            try {
                console.assert( (
                    treatment === 'nofeedback' && 
                    _.isNil( chosenQuestion.matchingGameId ) && 
                    _.isNil( nextQuestion.matchingGameId )
                ) || (
                    treatment === 'feedback' && 
                    !_.isNil( chosenQuestion.matchingGameId ) && 
                    !_.isNil( nextQuestion.matchingGameId )
                ), "Error PSDFGKSDFG: No match?" );
            } catch(err) {
                console.log("Error PSDFGKSDFG: No match?", muid, treatment, chosenQuestion, nextQuestion, sec, sec_rnd, err);
                throw(err);
            }
            if (treatment === 'nofeedback') {
                //console.log("setChosenGameForRound 9");
                tmp = Questions.update(nextQuestion._id, {$set : { 
                    payoffs : chosenQuestion.payoffs,
                    matchingGameId : null,
                }});
            } else {
                let matchingQuestion;
                if (focalPlayersChoice) {
                    // NOT first try the post-forced-choice question from section 1.  
                    // NOT   if that's the other player of the same game, go
                    // NOT   otherwise, match to the match of the chosen game 
                    // I actually can't do this kind of matching at all, without adding dizzying complexity elsewhere, because if the player in ithe feedback condition is guaranteed their pick of game after the forced choice, I can't match within section because that is P1 vs P1 instead of P1 vs P2, and I can't guarantee a match with the previous section because they might have chosen and played the other game, in which case I could just pick the round 0 or round 1 game they played beofre that, and match to that, but that's the dizzying ocmplexity, because I'd have to track that I'd matched to an already matched game (since nofeedback round 0 game is matched to feedback round 0 game already) and that I shouldn't recalculate the payoffs of that side of the game when i calculate them for this side of the game.
                    //matchingQuestion = Questions.findOne({
                        //_id : {$ne : nextQuestion._id}, 
                        //cohortId : nextQuestion.cohortId, 
                        //sec_rnd : nextQuestion.sec_rnd, 
                        //type : nextQuestion.type, 
                        //strategic : true
                    //});
                    //if ( !_.isNil(matchingQuestion) && !Helper.comparePayoffs(nextQuestion, matchingQuestion, pivot=true) ) {
                        //matchingQuestion = Questions.findOne({ _id : chosenQuestion.matchingGameId, });
                    //}
                    //try {
                        //console.assert( !_.isNil( matchingQuestion ), "Error IOUFDKJLLLLLL: No match" );
                        //console.assert( Helper.comparePayoffs(nextQuestion, matchingQuestion, pivot=true), "Error UARYJJDFGASDF: Bad match" );
                    //} catch(err) {
                        //console.log(err, muid, chosenQuestion, nextQuestion, matchingQuestion);
                    //}
                } else if (firstPlayersChoice) {
                // REMEMBER: this is a pivoted version of the chosen question above
                    matchingQuestion = Questions.findOne({_id : nextQuestion.matchingGameId}); 
                    let tmpMatchingQuestion = Questions.findOne({
                        _id : {$ne : nextQuestion._id}, 
                        cohortId : nextQuestion.cohortId, 
                        sec_rnd : nextQuestion.sec_rnd, 
                        type : nextQuestion.type, 
                        strategic : true
                    });
                    try {
                        console.assert( nextQuestion.matchingGameId === tmpMatchingQuestion._id , "Error (OFDUIS99: games aren't connecting" );
                    } catch(err) {
                        console.log("Error (OFDUIS99: games aren't connecting" , muid, chosenQuestion, nextQuestion, matchingQuestion, err);
                    throw(err);
                    }
                }
                try {
                    console.assert( !_.isNil( matchingQuestion ), "Error IOUFDKJLLLL: No match" );
                    console.assert( !_.isNil( matchingQuestion.payoffs ), "Error IOUFDKJLLLL2: No match" );
                } catch(err) {
                    console.log("Error IOUFDKJLLLL: No match", muid, chosenQuestion, nextQuestion, matchingQuestion, err);
                    throw(err);
                }
                //let b4 =   Questions.find(nextQuestion._id).fetch();
                tmp = Questions.update(nextQuestion._id, {$set : { 
                    payoffs : Helper.pivotGame( matchingQuestion.payoffs ),
                    matchingGameId : matchingQuestion._id,
                }});
                tmp2 = Questions.update(matchingQuestion._id, {$set : { 
                    matchingGameId : nextQuestion._id,
                }});
                //let aftar =   Questions.find(nextQuestion._id).fetch();
                //console.log("setChosenGameForRound before update ", b4, " and after", aftar, tmp, tmp2);
            }
            try {
                console.assert( tmp === 1, 'too many matches in setchosengameforround');
            } catch (err) {
                console.log( 'too many matches in setchosengameforround', tmp, nextQuestion, chosenGameId, err);
                throw(err);
            }
            //console.log("setChosenGameForRound again", chosenQuestionFocalPlayer.payoffs, nextQuestion, tmp);
            return(nextQuestion._id);
        },
        initializeReturnSubject : function(asst, design) {
            let subPast = SubjectsStatus.findOne({ meteorUserId : asst.userId });
            SubjectsStatusArchive.insert( subPast );
            SubjectsStatusArchive._ensureIndex({mtAssignmentId : 1, meteorUserId : 1}, { unique : true } );
            SubjectsStatus.remove( { meteorUserId : asst.userId } );
            Meteor.call("initializeSubject", asst, design );
        },
    });
