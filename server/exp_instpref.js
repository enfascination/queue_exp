/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Schemas } from '../api/design/schemas.js';
import { Helper } from '../imports/lib/helper.js';
import { Sess } from '../imports/lib/quick-session.js';

export let Experiment = {};
Experiment.findSubsCohort= function(sub, lastDesign, matching) {
            //get a cohortId, not know much, under different matching conditions
            let probeDesign, cohortId, treatment = sub.treatment_now;

            // if this is here, then I've seen anyone at all make it to this part of the experiment before.
            probeDesign = CohortSettings.findOne( { sec_type : "experiment" }, 
                { sort : { cohortId : -1} });

            if ( _.isNil( probeDesign ) ) { // server has been reset and there are no design in database
                console.log("First round of install", sub, Helper.des(lastDesign) );
                cohortId = 1;
                treatment = "nofeedback";
            } else if (matching.noMatching) { // everyone should start a cohort with each section and no one shoudl complete one
                console.log("no matching", probeDesign.cohortId + 1);
                try {
                    console.assert( (sub.cohort_now === 0 ) || (sub.sec_now === 'experiment2') , "problem in no matching" );
                } catch(err) {
                    throw(err);
                }
                cohortId = probeDesign.cohortId + 1;
                treatment = "nofeedback";
            } else if ( matching.selfMatching ) {
                console.log("self matching");
                if (sub.cohort_now === 0 ) {  // create a new cohort for this person
                    try {
                        console.assert( sub.sec_rnd_now === 0, "problem in self matching" );
                        console.assert( sub.sec_now === 'experiment1', "problem in self matching 2" );
                    } catch (err) { throw(err); }
                    cohortId = probeDesign.cohortId + 1;
                    treatment = "nofeedback";
                    console.log("self matching exp 1", cohortId, treatment, sub.meteorUserId);
                } else {
                    cohortId = sub.cohort_now;
                    treatment = "feedback";
                    console.log("self matching exp 2", cohortId, treatment, sub.meteorUserId);
                }
            } else if (
                    matching.ensureSubjectMismatchAcrossSections || 
                    matching.ensureSubjectMismatchAcrossSectionsAndPreferentiallyCloseOutIncompleteCohorts 
                ) {
                console.log("main matching", treatment);
                //      if the sub is in a feedback condition
                //            look for an unfinished cohort
                //            unless there is no unfinished cohort
                //                   find them a cohort number in need of matching
                //            else
                //                   change them to a no-feedback treamtent and fail through to next if
                //      if the subject is in a nofeedback condition
                //            start them a new cohort
                //
                // (try to) match this person to an existing cohort  
                if ( treatment === "feedback" ) {
                    let cohortInProgress = CohortSettings.findOne( { 
                        sec_type : "experiment", 
                        completed : false, 
                        matchable : true, 
                        cohortId : {$gt : 0},
                        // no self matching
                        // and no self matching with same turker later
                        playerOne : { $nin : [ sub.meteorUserId, sub.mtWorkerId ] }, 
                        // playerTwo test is to prevent collisions (is 
                        // someone-in-progress currently matched to this 
                        // and I don't know?
                        playerTwo : null, 
                    }, 
                    // the sorting here is important: 
                    //    FIFO for unfinished cohorts
                    { sort : { cohortId : 1} }); 

                    // should I bail on trying to match this subject?
                    if ( _.isNil( cohortInProgress ) ) {
                        console.log("main matching: no match to make");
                        treatment = "nofeedback";
                    }

                    // match this subject
                    //// must double check: is this still the right thing for this subject?
                    if ( treatment === "feedback" ) {
                        // make sure everything is sanitary
                        // player two should be null is matchable is true
                        try {
                            console.assert( _.isString( cohortInProgress.playerOne ) &&
                                cohortInProgress.playerOne.length > 1 &&
                                _.isNil( cohortInProgress.playerTwo ) &&
                                cohortInProgress.filledCohort === 1 &&
                                true,
                                "cohort that was foudn is well formed"
                            );
                        } catch (err) { 
                            console.log("problem in real matching" , cohortInProgress);
                            console.log( _.isString( cohortInProgress.playerOne ) ,
                                cohortInProgress.playerOne.length > 1 ,
                                _.isNil( cohortInProgress.playerTwo ),
                                cohortInProgress.filledCohort === 1 ,
                                cohortInProgress,
                                "cohort that was foudn is well formed"
                            );
                            throw(err); 
                        }
                        cohortId = cohortInProgress.cohortId;
                        console.log("real matching feedback", cohortId, sub.meteorUserId );
                    } else {
                        // fail through to next block
                    }
                }

                // get this subject a new cohort
                if ( treatment === "nofeedback" ) {  // create a new cohort for this person
                    cohortId = probeDesign.cohortId + 1;
                    console.log("real matching, no feedback", cohortId, sub.meteorUserId );
                }
            } else if (matching.ensureSubjectMatchAcrossSections) {
            } 
            return( {"cohortId" : cohortId, "treatment" : treatment } );
        };
// either for new or continuation of existing cohorts, to update them with player and status information
Experiment.initializeCohort = function(cohortId, playerToAdd, newSectionType="experiment") {
    //  http://stackoverflow.com/questions/18887652/are-there-private-server-methods-in-meteor
    //if (this.connection === null) { /// to make method private to server
    let design;
    if ( _.isNil( CohortSettings.findOne({ cohortId : cohortId }) ) ) { // new cohort 
        let newDesign = _.clone(Design);
        newDesign.completed = false;
        newDesign.matchable = false;
        newDesign.cohortId = cohortId; // uid for designs, a unique one for each cohort
        //newDesign.sec = newSection;
        newDesign.sec_type = newSectionType;
        //newDesign.sec_rnd = newRound;
        newDesign.playerOne = playerToAdd;
        newDesign.playerTwo = null;
        newDesign.filledCohort = 1;  //incl currently considered player
        try {
            let idtmp = CohortSettings.insert( newDesign );
            Schemas.CohortSettings.validate( newDesign );
            console.assert( Match.test( newDesign, Schemas.CohortSettings) );
        } catch (err) {
            console.log("ERROR 56JFKADF: Schema violation adding cohort", cohortId, idtmp, newDesign, Match.test( newDesign, Schemas.CohortSettings), err);
            throw(err);
        }
        // uniqueness check
        try {
            CohortSettings._ensureIndex({cohortId : 1}, { unique : true } );
        } catch (err) {
            console.log("Data failed uniqueness: CohortSettings", cohortId, newDesign );
            throw(err);
        }
        design = newDesign;
    } else { // existing design

        // two updates:
        //set playerTwo in cohortInProgress to this player
        //increment filled in cohortinProgress?
        CohortSettings.update({cohortId : cohortId},{
            $set : {
                playerTwo : playerToAdd,
                matchable : false,  // this prevents collisions
            }, 
            $inc : {
                filledCohort : 1,
            } });

        design = CohortSettings.findOne({cohortId : cohortId});
    }

    return( design );
    //} else {
    //throw(new Meteor.Error(500, 'Permission denied!'));
    //}
};
Experiment.updateQuestionInSubData = function(q) {

            let tmp = SubjectsData.update({ 
                _id : q._id,
            }, {
                $set: {
                    "timestamps.gameConsummated": Date.now(),
                    "theDataConsummated": q,
                    "consummatedChoice" : true,
                },
            });
    try { 
        console.assert(tmp === 1, "right number of objects got updated");
    } catch(err) {
        console.log("wrong number of objects got updated", tmp, q );
        throw(err);
    }
            //console.log("updateQuestionInSubData");
            //let ss = SubjectsStatus.findOne({ meteorUserId: muid });
            //let sd = SubjectsData.findOne({ meteorUserId: muid , theData.cohortId : cohortId, sec : section, sec_rnd : round });
            //return({ "s_status" : ss, "s_data" : sd });
        };
Experiment.tryToCompleteUncompletedQuestions = function(sub, design) {
    let qs = Questions.find({ meteorUserId : sub.meteorUserId, cohortId : sub.cohort_now, sec : sub.sec_now });
    let matches = 0;
    qs.forEach( function(q) {
        //console.log("to match?", (q.strategic && _.isString( q.matchingGameId ) && !q.completedGame), q);
        // if question involves another matchable question, and that question is know, and if this question has been answered, but hasn't yet been consummated with the other question, then consummate by calculating outcomes and corersponding payoffs.
        if (
            q.strategic && 
            !_.isNil( q.matchingGameId ) && 
            !_.isNil(q.choice) && 
            !q.completedGame
        ) {
            //after completing questions, returns fresh objects
            let qPair = Experiment.completeQuestionPair( q._id, q.matchingGameId, design );
            Experiment.updateQuestionInSubData( qPair[0] );
            Experiment.updateQuestionInSubData( qPair[1] );
            matches += 2;
        }
    });
    console.log("completeUncompleted.  matches:", matches, qs.count());
};
Experiment.completeQuestionPair = function(q1, q2, design) {
    //console.log("Experiment.tryToCompleteQuestion", q1, Helper.des(design));
    console.log("Experiment.tryToCompleteQuestion", q1, q2);
    // determine if this is the first or second (ideally without knowing about matching protocol
    let question1 = Questions.findOne({ _id : q1 });
    //let question2 = Questions.find({ type : "chooseStrategy", cohortId : design.cohortId, sec_rnd : question1.sec_rnd, payoffs : Helper.pivotGame(question1.payoffs) });
    let question2 = Questions.findOne({ _id : q2 });
    //assert that mpayoffs match
    try {
        console.assert( !( _.isNil(question1) || _.isNil(question2) ),  "Experiment.tryToCompleteQuestion problem 1: called with no match", question1, question2);
        console.assert( !(_.isNil(question1.choice) || _.isNil(question2.choice)),  "Experiment.tryToCompleteQuestion problem 2: called before all choices made", question1, question2);
        console.assert( !(_.isNil(question1.payoffs) || _.isNil(question2.payoffs)),  "Experiment.tryToCompleteQuestion problem 2: payoffs bugged out", question1, question2);
        // get eachsubjects choices
        console.assert( Helper.comparePayoffs(question1, question2, pivot=true), "payoff calc -1: got payoffs successfully" );
        console.assert( question1.cohortId === question2.cohortId , "payoff calc -2: got payoffs successfully" );
    } catch(err) { 
        console.log(err, question1, question2); 
        console.log("try to complete", question1._id, question2._id, question1.payoffs, Helper.pivotGame(question2.payoffs ), question2.payoffs );
        throw(err);
    }
    let c1 = question1.choice;
    let c2 = question2.choice === "Top" ? "Left" : "Right";
    let outcomePerspectiveP1 = ""+c1+","+c2;
    let c1p2 = question1.choice === "Top" ? "Left" : "Right";
    let c2p2 = question2.choice;
    let outcomePerspectiveP2 = ""+c2p2+","+c1p2;
    let c1Poss = question1.choice === "Top" ? [0,4,1,6] : [2,5,3,7];   //see pivotGame for the meanings of indices
    let c2Poss = question2.choice === "Top" ? [0,4,2,5] : [1,6,3,7];   // Top === Left && Bottom === Right
    let outcomePayoffs = _.sortBy ( _.intersection( c1Poss, c2Poss) );
    let payoffP1 = question1.payoffs[ outcomePayoffs[0] ];
    let payoffP2 = question1.payoffs[ outcomePayoffs[1] ];
    console.log("tried to complete", outcomePerspectiveP1, outcomePerspectiveP2, outcomePayoffs);
    try {
        console.assert( outcomePayoffs.length === 2, "payoff calc 0: got payoffs successfully" );
        console.assert( outcomePayoffs[0] < 4, "payoff calc 1: payoffs ordered right and assigned right" );
        console.assert( outcomePayoffs[1] > 3, "payoff calc 2: payoffs ordered right and assigned right" );
    } catch(err) { 
        console.log(err, question1, question2, outcomePayoffs); 
    }
    question1.outcome = outcomePerspectiveP1;
    question1.outcomeFocal = c1;
    question1.outcomeOther = c2;
    question1.payoffEarnedFocal = payoffP1;
    question1.payoffEarnedOther = payoffP2;
    question1.completedGame = true;
    question2.outcome = outcomePerspectiveP2;
    question2.outcomeFocal = c1p2;
    question2.outcomeOther = c2p2;
    question2.payoffEarnedFocal = payoffP2;
    question2.payoffEarnedOther = payoffP1;
    question2.completedGame = true;
    Questions.update( question1._id, {$set : question1});
    Questions.update( question2._id, {$set : question2});
    console.log("setCompleteion");
    //console.log("setCompleteion", "after", Questions.findOne( question1._id), "\n", Questions.findOne( question2._id));
    return([ Questions.findOne( question1._id ), Questions.findOne(  question2._id ) ]);
};
Experiment.tryToCompleteCohort = function(design) {
    let completed = false;
    let cohortId = design.cohortId;

    // make it safe to over-call this function
    //    abort if cohort is already complete
    if ( CohortSettings.findOne(
        { cohortId: cohortId}
    ).completed ) {
        return;
    }

    let unansweredQs = Questions.find( { cohortId : cohortId, strategic : true, answered : false });
    let answeredQs   = Questions.find( { cohortId : cohortId, strategic : true, answered : true });
    let playerCount = _.uniq( answeredQs.map( function(q) {
        return( q.meteorUserId );
    }) ).length;
    console.log("complete cohort 3", playerCount, unansweredQs.count(), answeredQs.count() );

    console.log( "cohort completion, matchabilitiy settings:", (unansweredQs.count() === 0 , answeredQs.count() > 0 ));
    if (unansweredQs.count() === 0 && answeredQs.count() > 0  ) {
        // this test used to be more complicated testing either 
        //playerCount === design.maxPlayersInCohort  or 
        //for selfmatching (in which there is only one player id for both games
        if ( _.isString(design.playerOne) && _.isString(design.playerTwo) && design.filledCohort === 2   ) {

            // get rid of old cohort (make it outdated/complete)
            completed = true;
            CohortSettings.update({ cohortId: cohortId}, {
                $set: { 
                    completed: true, 
                    matchable: false, // this is actually redundant: I do this sooner
                },
            }//, {multi: true}  //d ont' want to need this.
            );
            try {
                console.assert(design.maxPlayersInCohort === design.filledCohort, "sanity6: do i really only have two subjects?", design );
                console.assert( answeredQs.count() === answeredQs.map( function(q) { if( q.payoffs ) { return( q ); } }).length );
                console.assert( answeredQs.count() === answeredQs.map( function(q) { if( !_.isNil( q.matchingGameId ) ) { return( q ); } }).length );
            } catch(err) { 
                console.log(err, completed, unansweredQs, answeredQs);
                throw(err);
            }
            console.log("COHORT COMPLETED", cohortId);
            return(true);
        } else if ( _.isNil( design.playerTwo ) && design.filledCohort < 2) {
            // cohort still in progress
            CohortSettings.update({ cohortId: cohortId}, {
                $set: { matchable: true, },
            });//, {multi: true}  //d ont' want to need this.
            console.log("COHORT MATCHABLE", cohortId,  design.matchable , design.filledCohort , design.filledCohort === 2 );
            return(false);
        } else {
            console.log("ERROR &Q#$TREJGAFGK: Matched cohort in progress: cohort is matched but not complete, but actually this must be a bug because in this loop there remain no unasnwered questions", design, Questions.find( { cohortId : cohortId, strategic : true}).fetch() );
        }
    }
};
Experiment.completeGameCompare = function(compareGamesId, chosenGameId, nextGameId) {
    let updateToCompare;
    chosenGame = Questions.findOne(chosenGameId);
    nextGame = Questions.findOne(nextGameId);
    //console.log("completeGameCompare, after setChosenGameForRound1", compareGamesId, chosenGameId, nextGameId, chosenGame, nextGame );
    //console.log("completeGameCompare, after setChosenGameForRound2", compareGamesId, chosenGame.payoffs, nextGame.payoffs, Helper.comparePayoffs( chosenGame, nextGame ));
    if ( Helper.comparePayoffs( chosenGame, nextGame ) ) {
        Questions.update( compareGamesId, { $set : { gotPreferredGame : true } } );
        Questions.update( nextGameId, { $set : {gameWasPreferred : true } } );
    } else {
        Questions.update( compareGamesId, { $set : { gotPreferredGame : false } } );
        Questions.update( nextGameId, { $set : {gameWasPreferred : false } } );
    }
};
Experiment.calculateExperimentEarnings = function(muid, design) {
    // start with subject
    let sub = SubjectsStatus.findOne({ meteorUserId : muid });
    // get all paid complete questions from subject
            let paidQuestions = Questions.find({
                meteorUserId : muid, 
                mtAssignmentId : sub.mtAssignmentId, 
                sec : { $in : ['experiment1', 'experiment2'] },
                paid : true,
            });
            let surveyQuestions = Questions.find({
                meteorUserId : muid, 
                mtAssignmentId : sub.mtAssignmentId, 
                sec : 'survey',
            });
    // determine that all (any?) survey questions were answered
    let surveyComplete = surveyQuestions.count() > 0  && 
            surveyQuestions.count() === 
        surveyQuestions.fetch().filter( (q)=>q.answered === true).length;
    try {
        console.assert( surveyQuestions.fetch().filter( (q)=>q.answered === true).length ===
            surveyQuestions.map(function(q){
                if (q.answered)  { return(q); } 
            }).length,
            "can't use cursor.map like filter!");
    } catch (err) {
        console.assert( surveyQuestions.fetch().filter( (q)=>q.answered === true).length ,
            surveyQuestions.map(function(q){
                if (q.answered)  { return(q); } 
            }).length,
            surveyQuestions.fetch(),
            "can't use cursor.map like filter!"
        );
        throw( err );
    }

    let gameEarnings = 0;
    paidQuestions.forEach( function( q ) {
        if ( q.completedGame ) {
            gameEarnings += q.payoffEarnedFocal * design.pointEarnings;
        }
    });
    let HITearnings = { 
        total : design.endowment + gameEarnings + ( surveyComplete ? design.surveyEarnings : 0 ), 
        breakdown : { 
            endowment: design.endowment, 
            games : gameEarnings,
            survey : surveyComplete ? design.surveyEarnings : 0 
        }
    };
    console.log("calculateExperimentEarnings", HITearnings, paidQuestions.count(), surveyQuestions.count(), surveyComplete, paidQuestions.map( (q) => q.payoffEarnedFocal ) );

    return( HITearnings );
};
// set the subject to have earnings X in the game
//  and set the subject to have earnings X in MTurk
Experiment.updateExperimentEarnings = function(muid, design) {
    let totalEarnings = Meteor.call("calculateExperimentEarnings", muid, design).total;
    let subbk = SubjectsStatus.findOne({ meteorUserId: muid });
    let tmpId = SubjectsStatus.update({meteorUserId: muid }, {
        $set: {
            totalEarnings : totalEarnings,
        },
    });
    let asst = TurkServer.Assignment.getAssignment( subbk.tsAsstId );
    asst.setPayment( totalEarnings );
};
Experiment.updateStatusInHIT = function(muid, design) {
    let sub = SubjectsStatus.findOne({ meteorUserId: muid });
    /// remember that there is not a single other player: i may in each section paly a different player within a different cohortId
    let ownQs = Questions.find({
        meteorUserId : muid, 
        mtAssignmentId : sub.mtAssignmentId, 
        strategic : true, 
        paid : true 
    }); // could be across multiple cohorts
    let nOwnQsAnswered = ownQs.fetch().filter( (q)=>q.answered === true).length;
    let nOwnQsConsummated = ownQs.fetch().filter( (q)=>q.completedGame === true).length;
    console.log("Experiment.updateExperimentEarnings", ownQs.count(), nOwnQsAnswered, nOwnQsConsummated);
    let HITStatus = {
            gamesPlayed : nOwnQsAnswered,
            gamesConsummated : nOwnQsConsummated,
    };
    let tmpId = SubjectsStatus.update({meteorUserId: muid }, {
        $set: { HITStatus: HITStatus, },
    });
};
Experiment.testErrors = function() {
            try {
                let tt;
                tt.under.over = 5;
            } catch(err) {
                console.log("probl");
                throw(err);
            }
        };
