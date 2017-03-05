/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Schemas } from '../api/design/schemas.js';
import { Helper } from '../imports/lib/helper.js';

export let Experiment = {};
Experiment.findSubsCohort= function(sub, lastDesign, matching) {
            //get a design, not knowing cohortId, under different matching conditions
            let probeDesign, design;
            let familiarCohort = false;

            // if this is here, then I've seen anyone at all make it to this part of the experiment before.
            probeDesign = CohortSettings.findOne( { sec_type : "experiment", sec: { $nin : ['survey', 'earningsReport']} }, 
                { sort : { cohortId : -1} });

            if ( _.isNil( probeDesign ) ) { // server has been reset and there are no design in database
                console.log("First round of install", sub, Helper.des(lastDesign) );
                design = Meteor.call("initializeCohort", cohortId=0, sub.sec_type_now, sub.meteorUserId);
                familiarCohort = false;
                //console.log("First round of install", design);
            } else if (matching.noMatching) { // everyone should be a sinigle person cohort, no matching
                let cohortId;
                if ( sub.sec_rnd_now === 0 ) {
                    console.assert( (sub.cohort_now === 0 ) || (sub.sec_now === 'experiment2') , "problem in self matching 3" );
                    cohortId = probeDesign.cohortId + 1;
                    design = Meteor.call("initializeCohort", cohortId=cohortId, sub.sec_type_now, sub.meteorUserId);
                } else {
                    cohortId = sub.cohort_now;
                    design = CohortSettings.findOne( { 
                        cohortId : cohortId, 
                    } );
                }
                familiarCohort = false;
                console.log("no matching");
            } else if ( matching.selfMatching ) {
                console.log("self matching");
                let cohortId;
                if (sub.cohort_now === 0 ) {
                    console.assert( sub.sec_rnd_now === 0, "problem in self matching" );
                    console.assert( sub.sec_now === 'experiment1', "problem in self matching 2" );
                    cohortId = probeDesign.cohortId + 1;
                    design = Meteor.call("initializeCohort", cohortId=cohortId, sub.sec_type_now, sub.meteorUserId, sub.meteorUserId);
                    familiarCohort = false;
                    console.log("self matching exp 1", cohortId, sub.meteorUserId, Helper.des(design).sec_type );
                } else {
                    cohortId = sub.cohort_now;
                    design = CohortSettings.findOne( { 
                        cohortId : cohortId, 
                    } );
                    console.log("self matching exp 2", cohortId, sub.meteorUserId, Helper.des(design).sec_type );
                    familiarCohort = true;
                }
                //// reffing subjectsdata in this function is unusual, but necessary for spotting past cohorts including this partiicpants
                //let previousByThisSubject = SubjectsData.find( {
                    //meteorUserId : sub.meteorUserId, 
                    ////// Here i'm defining self matching to send the subject to he same 
                    ////// cohort regardless of what round or section they are in.  
                    ////sec : sub.sec_now, 
                    ////sec_rnd : sub.sec_rnd_now, 
                //}, { sort : {  "theData.cohortId" : 1, "theData.queuePosition" : -1, sec : 1, sec_rnd : 1 } });
                //previousByThisSubject.forEach( function( subjectData ) {
                    //let innerDesign = CohortSettings.findOne( { 
                        //"cohortId" : subjectData.theData.cohortId,
                        //"sec" : subjectData.sec,
                        //"sec_rnd" : subjectData.sec_rnd,
                        //$where: "this.filledCohort < this.maxPlayersInCohort", 
                    //});
                    ////console.log("inner", innerDesign);
                    //if ( !_.isNil(innerDesign) ) {
                        //design = innerDesign;
                    //}
                ////});
                //console.log( "self matching test", previousByThisSubject.fetch().length, design );
                //if ( _.isNil(design) ) {
                    //let cohortId = probeDesign.cohortId + 1;
                    //design = Meteor.call("initializeCohort", cohortId=cohortId, sub.sec_now, sub.sec_type_now, sub.sec_rnd_now);
                    //familiarCohort = false;
                //} else {
                    //design = design;
                    //familiarCohort = true;
                //}
            } else if (matching.ensureSubjectMismatchAcrossSections) {
            } else if (matching.ensureSubjectMatchAcrossSections) {
            } else { // default: i don't care how subjects match or rematch across sections or within rounds
                    console.log("default matching");
                //get a design, not knowing cohortId
                // cases:
                // as the very first subject in the system (create a new design object)
                // im entering or continuing in the experiment 
                //      as the first subject in my cohort (create a new design object)
                //      as a subsequent subject (use an existing design object)

                // initialize player objects; start with determining state
                    // now try to get a design for the right conditions, still not knowing my cohortId
                    design = CohortSettings.findOne( { 
                        $where: "this.filledCohort < this.maxPlayersInCohort", 
                    },
                        { sort : { cohortId : 1} }
                    );

                    if ( _.isNil(design) ) { // need to create a new cohort objects
                        let cohortId, maxCohortId;
                        maxCohortId = probeDesign.cohortId;
                        if ( sub.sec_rnd_now === 0 ) {
                            cohortId = maxCohortId + 1;
                        } else {
                            cohortId = maxCohortId;
                        }
                        //console.log("First player in cohort/section/round", sub, cohortId, lastDesign);
                        console.log("First player in cohort/section/round");
                        try {
                            design = Meteor.call("initializeCohort", cohortId, sub.sec_type_now);
                        } catch (err) {
                            console.log("BADNESS: Recovering from earlier corruption due to error between initializing cohort and initiliazeing corespongding data object 2nd time");
                            design = CohortSettings.findOne( { 
                                cohortId : cohortId, 
                            } );
                            return( { design, familiarCohort : true });
                        }
                        //console.log("First player in cohort/section/round", design);
                    } else {
                        // if i made it in here, then design defined in this block is the design I want to use and i want its info
                        //    this will be the case if I'm entering a cohort as a non-first person, regardles of the round i'm enetering in
                        familiarCohort = true;
                        design = design;
                        //console.log( "Found round for continuing player", design );
                        console.log( "Found round for continuing player");
                    }

                // various tests
                try {
                    // either this is the first deisgn or you're not on round zero or your on a later section.  
                    //    this depends on the frst experimental section being the third (3-1 = 2) in the DesignSequence after instructions and quiz
                    console.assert( _.isNil( lastDesign ) || sub.sec_rnd_now > 0 || _.indexOf( Object.keys( DesignSequence ), sub.sec_now ) > 2, "sanity1");
                    // there is a missing test here because i'm letting you be in different cohorts in different roudns
                    //console.assert( sub.sec_now === design.sec, "sanity7");
                    //console.assert( sub.sec_rnd_now === design.sec_rnd, "sanity8");
                    console.assert( !_.isNil( design ) , "design is null?");
                    //sanity for existing subjects
                    if ( !_.isNil( lastDesign ) && familiarCohort ) { 
                        try {
                            ////console.assert( sub.sec_now === lastDesign.sec || sub.sec_now === lastDesign.sec + 1 , "sanity3");
                            //console.assert( sub.sec_rnd_now === lastDesign.sec_rnd + 1 || sub.sec_rnd_now === 0 , "sanity4");
                        } catch(err) {
                            //console.log(err, sub, lastDesign, design);
                            //console.log(err);
                        }
                    }
                } catch(err) {
                    console.log(err, Helper.des(lastDesign), sub, sub.sec_rnd_now, Helper.des(design) );
                }

            }
            return( { design, familiarCohort } );
        };
//DEPRECATED?
Experiment.findSubsData = function( sub, lastDesign, dat, matching ) {
            let subjectPos, countInA, countInB, countInNoChoice;
            let design = dat.design;


            // experiment-specific logic
            // some state below depends on if the design object I got back was new or old
            if (dat.familiarCohort) {
                let previousSubject;
                if ( true || !matching.selfMatching ) {
                    /// previous subject  who isn't the main player
                    previousSubject = SubjectsData.findOne( {
                        meteorUserId : { $ne : sub.meteorUserId }, 
                        "theData.cohortId" : sub.cohort_now, 
                        sec : sub.sec_now, 
                        sec_rnd : sub.sec_rnd_now, 
                    }, { sort : {  "theData.cohortId" : -1, "theData.queuePosition" : -1 } });
                    //console.log("familiarCohort", dat.design, previousSubject, SubjectsData.findOne( {
                        //"theData.cohortId" : design.cohortId, 
                        //sec : design.sec, 
                        //sec_rnd : design.sec_rnd 
                    //}));
                    if (_.isNil(previousSubject)) {
                        return Helper.throwError(403, "something is seriously the matter: you can't play against yourself, but there isn't someone else");
                    }
                } else {
                    //previousSubject = SubjectsData.findOne( {
                        //meteorUserId : sub.meteorUserId, 
                        //"theData.cohortId" : design.cohortId, 
                        //sec : design.sec,  
                        //sec_rnd : design.sec_rnd,
                    //});
                    //console.log("debugself-matchinfinddata", design.cohortId, SubjectsData.findOne( { meteorUserId : sub.meteorUserId, "theData.cohortId" : design.cohortId,}), SubjectsData.findOne( { meteorUserId : sub.meteorUserId,})  );
                }
                subjectPos = previousSubject.theData.queuePosition + 1;
                countInA = SubjectsData.find({ "theData.cohortId": sub.cohort_now, 
                    sec : sub.sec_now, sec_rnd : sub.sec_rnd_now, "theData.choice": "A" }).fetch().length;
                countInB = SubjectsData.find({ "theData.cohortId": sub.cohort_now, 
                    sec : sub.sec_now, sec_rnd : sub.sec_rnd_now, "theData.choice": "B" }).fetch().length;
                countInNoChoice = SubjectsData.find({ "theData.cohortId": sub.cohort_now, 
                    sec : sub.sec_now, sec_rnd : sub.sec_rnd_now, "theData.choice": "X" }).fetch().length;
            } else {
                subjectPos = 1;
                countInA = 0;
                countInB = 0;
                countInNoChoice = 0;
            }

            let theData = {
                cohortId: design.cohortId,
                queuePosition: subjectPos,
                queuePositionFinal: -1,
                choice: 'X',
                earnings1: design.endowment,
                earnings2: 0,
                totalPayment: 0,
                queueCountA: countInA,
                queueCountB: countInB,
                queueCountNoChoice: countInNoChoice,
            };
            try {
                check(theData, Schemas.ExperimentAnswers);
            } catch (err) {
                console.log("Data failed validation");
                throw(err);
            }

            return( theData);
        };
Experiment.initializeCohort = function(newCohortId, newSectionType, playerOne, playerTwo='' ) {
    //  http://stackoverflow.com/questions/18887652/are-there-private-server-methods-in-meteor
    //if (this.connection === null) { /// to make method private to server
    //console.log("initializeCohort", newCohortId, newSection, newSectionType, newRound );
    let newDesign = _.clone(Design);
    newDesign.filledCohort = 0;
    newDesign.completedCohort = false;
    newDesign.cohortId = newCohortId; // uid for designs, a unique one for each cohort
    //newDesign.sec = newSection;
    newDesign.sec_type = newSectionType;
    //newDesign.sec_rnd = newRound;
    newDesign.playerOne = playerOne;
    newDesign.playerTwo = playerTwo;
    CohortSettings.insert( newDesign );
    try {
        CohortSettings._ensureIndex({cohortId : 1}, { unique : true } );
    } catch (err) {
        console.log("Data failed uniqueness: CohortSettings");
        throw(err);
    }
    return( newDesign );
    //} else {
    //throw(new Meteor.Error(500, 'Permission denied!'));
    //}
};
Experiment.submitExperimentChoice = function(muid, sec, sec_rnd, theData) {

            SubjectsData.update({ meteorUserId: muid , "theData.cohortId" : theData.cohortId, sec : sec, sec_rnd : sec_rnd }, {
                $set: {
                    "theData.choice": theData.choice,
                    "theData.earnings1": theData.earnings1,
                    "completedChoice" : true,
                },
            });
            //console.log("submitExperimentChoice");
            //let ss = SubjectsStatus.findOne({ meteorUserId: muid });
            //let sd = SubjectsData.findOne({ meteorUserId: muid , theData.cohortId : cohortId, sec : section, sec_rnd : round });
            //return({ "s_status" : ss, "s_data" : sd });
        };
Experiment.tryToCompleteUncompletedQuestions = function(sub, design) {
    let qs = Questions.find({ meteorUserId : sub.meteorUserId, cohortId : sub.cohort_now, sec : sub.sec_now });
    let matches = 0;
    qs.forEach( function(q) {
        console.log("to match?", (q.strategic && _.isString( q.matchingGameId ) && !q.completedGame), q);
        // if question involves another matchable question, and that question is know, and if this question has been answered, but hasn't yet been consummated with the other question, then consummate by calculating outcomes and corersponding payoffs.
        if (q.strategic && _.isString( q.matchingGameId ) && !_.isNil(q.choice) && !q.completedGame) {
            Experiment.completeQuestionPair( q._id, q.matchingGameId, design );
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
        console.assert( question1.payoffs.join('') === Helper.pivotGame(question2.payoffs ).join(''), "payoff calc -1: got payoffs successfully" );
        console.assert( question1.cohortId === question2.cohortId , "payoff calc -2: got payoffs successfully" );
    } catch(err) { 
        console.log(err, question1, question2); 
        console.log("try to complete", question1._id, question2._id, question1.payoffs, Helper.pivotGame(question2.payoffs ), question2.payoffs );
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
    //console.log("setCompleteion");
    console.log("setCompleteion", "after", Questions.findOne( question1._id), "\n", Questions.findOne( question2._id));
};
Experiment.tryToCompleteCohort = function(design) {
            let completedCohort = false;
            let cohortId = design.cohortId;

            // make it safe to over-call this function
            //    abort if cohort is already complete
            if ( CohortSettings.findOne(
                { cohortId: cohortId}
            ).completedCohort ) {
                return;
            }
    console.log("complete cohort 2" );
            
            let unansweredQs = Questions.find({ cohortId : cohortId, strategic : true, answered : false });
            let answeredQs = Questions.find( { cohortId : cohortId, strategic : true, answered : true });
            let playerCount = _.uniq( answeredQs.map( function(q) {
                return( q.meteorUserId );
            }) ).length;
    console.log("complete cohort 3", playerCount, unansweredQs.count(), answeredQs.count() );

            //console.log( "cohort completion", cohortFin.count(), cohortUnfin.count(), design.maxPlayersInCohort );
            if (unansweredQs.count() === 0 && (
                    playerCount === design.maxPlayersInCohort || 
                    ( playerCount === 1 && design.matching.selfMatching && design.filledCohort === 2) 
                ) ) {
                // get rid of old cohort (make it outdated/complete)
                completedCohort = true;
                CohortSettings.update({ cohortId: cohortId}, {
                    $set: { completedCohort: true, },
                }//, {multi: true}  //d ont' want to need this.
                );
                try {
                    console.assert(design.maxPlayersInCohort === design.filledCohort, "sanity6: do i really only have two subjects?", design );
                } catch(err) { console.log(err); }
                return(true);
            } else {
                // cohort still in progress
                return(false);
            }
};
Experiment.calculateExperimentEarnings = function(muid, design) {
    // start with subject
    // get all paid complete questions from subject
            let paidQuestions = Questions.find({
                meteorUserId : muid, 
                sec : { $in : ['experiment1', 'experiment2'] },
                paid : true,
            });
            let surveyQuestions = Questions.find({
                meteorUserId : muid, 
                sec : 'survey',
                paid : true,
            });
    // determine that all (any?) survey questions were answered
    let surveyComplete = ( surveyQuestions.count() > 0 ) && surveyQuestions.count() === surveyQuestions.map(function(q){ if (q.answered)  {return(q);} }).length;
    let gameEarnings = 0;
    paidQuestions.forEach( function( q ) {
        if ( q.completedGame ) {
            gameEarnings += q.payoffEarnedFocal * design.pointEarnings;
        }
    });
    let HITearnings = { total : design.endowment + gameEarnings + ( surveyComplete ? design.surveyReward : 0 ), breakdown : { endowment: design.endowment, games : gameEarnings, survey : surveyComplete ? design.surveyReward : 0 }};
    console.log("calculateExperimentEarnings", HITearnings, paidQuestions.count(), surveyQuestions.count(), paidQuestions.map( (q) => q.payoffEarnedFocal ) );

    return( HITearnings );
};
// set the subject to have earnings X in the game
//  and set the subject to have earnings X in MTurk
Experiment.updateExperimentEarnings = function(muid, design) {
    let totalEarnings = Meteor.call("calculateExperimentEarnings", muid, design).total;
    SubjectsStatus.update({meteorUserId: muid }, {
        $set: {
            totalEarnings : totalEarnings,
        },
    });
    let subbk = SubjectsStatus.findOne({ meteorUserId: muid });
    let asst = TurkServer.Assignment.getAssignment( subbk.tsAsstId );
    asst.setPayment( totalEarnings );
};
