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
            probeDesign = CohortSettings.findOne( { sec_type : "experiment", sec: { $ne : 'survey'} }, 
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
                    console.log("self matching exp 1", cohortId, sub, Helper.des(design).sec_type );
                } else {
                    cohortId = sub.cohort_now;
                    design = CohortSettings.findOne( { 
                        cohortId : cohortId, 
                    } );
                    console.log("self matching exp 2", cohortId, sub, Helper.des(design).sec_type );
                    familiarCohort = true;
                }
                console.log("self matching", Helper.des(design).sec_type );
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
Experiment.tryToCompleteQuestionPair = function(q, design) {
    //console.log("Experiment.tryToCompleteQuestion", q, Helper.des(design));
    console.log("Experiment.tryToCompleteQuestion");
    // determine if this is the first or second (ideally without knowing about matching protocol
    let question1 = q;
    //let question2 = Questions.find({ type : "chooseStrategy", cohortId : design.cohortId, sec_rnd : q.sec_rnd, payoffs : Helper.pivotGame(q.payoffs) });
    let question2 = Questions.findOne({ _id : q.matchingGameId});
    //assert that mpayoffs match
    if (_.isNil(question2)) {
        console.log( "Experiment.tryToCompleteQuestion problem 1: called with no match", q._id, q.matchingGameId, question2, q );
        return(false);
    }
    // exit if not completed
    if (_.isNil( q.payoffs )) { console.log("NO PAYFOFS IN trytocomplete"); }
    //console.log("payoffs comparison", q, question2.fetch()[0]);
    //console.log("payoffs comparison", q.payoffs, question2.fetch()[0].payoffs);
    //console.log("payoffs comparison2", Helper.pivotGame(question2.fetch()[0].payoffs), Helper.pivotGame(q.payoffs));
    //console.log("Experiment.tryToCompleteQuestion", Questions.find({ type : "chooseStrategy", cohortId : design.cohortId, sec_rnd : q.sec_rnd, payoffs : Helper.pivotGame(q.payoffs) }).count(), Questions.find({  cohortId : design.cohortId, sec_rnd : q.sec_rnd, payoffs : Helper.pivotGame(q.payoffs) }).count(), Questions.find({ type : "chooseStrategy", sec_rnd : q.sec_rnd, payoffs : Helper.pivotGame(q.payoffs) }).count(), Questions.find({ type : "chooseStrategy", cohortId : design.cohortId, payoffs : Helper.pivotGame(q.payoffs) }).count(), Questions.find({ type : "chooseStrategy", cohortId : design.cohortId, sec_rnd : q.sec_rnd }).count(), "and", design.cohortId, q.sec_rnd, Helper.pivotGame(q.payoffs) );
    //question2 = Questions.findOne({ type : "chooseStrategy", cohortId : design.cohortId, sec_rnd : q.sec_rnd, payoffs : Helper.pivotGame(q.payoffs) });
    // get eachsubjects choices
    console.log("try to complete", question1, question2 );
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
    console.assert( outcomePayoffs.length === 2, "payoff calc 0: got payoffs successfully" );
    console.log("CRM1");
    console.assert( outcomePayoffs[0] < 4, "payoff calc 1: payoffs ordered right and assigned right" );
    console.log("CRM2");
    console.assert( outcomePayoffs[1] > 3, "payoff calc 2: payoffs ordered right and assigned right" );
    console.log("CRM3");
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
    //console.log("setCompleteion before ", question1, " and after", Questions.findOne( question1._id));
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
            
            let unansweredQs = Questions.find({ cohortId : cohortId, paid : true, answered : false });
            let answeredQs = Questions.find( { cohortId : cohortId, paid : true, answered : true });
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
Experiment.calculateExperimentEarnings = function(aDesign) {
            let queueasubjects, queuebsubjects, positionfinal, earnings2, totalpayment, asst, cohortId;
            cohortId = aDesign.cohortId;

            // experiment-specific logic
            queueASubjects = SubjectsData.find( {
                "theData.cohortId" : cohortId, "theData.choice" : "A", //sec : aDesign.sec, sec_rnd : aDesign.sec_rnd //eddepcrecaed
                }, {sort : { "theData.queuePosition" : 1 } } ).fetch() ;
            queueBSubjects = SubjectsData.find( {
                "theData.cohortId" : cohortId, "theData.choice" : "B", //sec : aDesign.sec, sec_rnd : aDesign.sec_rnd               //eddepcrecaed
                }, {sort : { "theData.queuePosition" : 1 } } ).fetch() ;
            positionFinal = 1;

            for ( let sub of _.concat(queueASubjects, queueBSubjects ) ) {

                // experiment-specific logic
                // maybe figure out here how to recover assignment from an old passed subject;
                earnings2 = aDesign.pot - ( (positionFinal-1) * aDesign.positionCosts );
                totalPayment = sub.theData.earnings1 + earnings2;

                SubjectsData.update({"theData.cohortId": cohortId, userId : sub.userId, sec : aDesign.sec, sec_rnd : aDesign.sec_rnd }, {
                    $set: { 
                        "theData.earnings2": earnings2, 
                        "theData.totalPayment": totalPayment, 
                        "theData.queuePositionFinal" : positionFinal,
                    },
                });
                subbk = SubjectsStatus.findOne({ meteorUserId: sub.meteorUserId });
                asst = TurkServer.Assignment.getAssignment( subbk.tsAsstId );
                asst.setPayment( totalPayment );
                positionFinal += 1;
            }
        };
