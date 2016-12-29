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
            probeDesign = CohortSettings.findOne( { sec_type : "experiment" }, 
                { sort : { cohortId : -1, sec_rnd : -1 } });

            if ( _.isNil( probeDesign ) ) { // server has been reset and there are no design in database
                console.log("First round of install", sub, lastDesign);
                design = Meteor.call("initializeCohort", cohortId=0, sub.sec_now, sub.sec_type_now, sub.sec_rnd_now);
                //console.log("First round of install", design);
            } else if (matching.noMatching) { // everyone should be a sinigle person cohort, no matching
                let cohortId;
                if ( sub.sec_rnd_now === 0 ) {
                    cohortId = probeDesign.cohortId + 1;
                } else {
                    cohortId = probeDesign.cohortId;
                }
                console.log("no matching");
                try {
                    design = Meteor.call("initializeCohort", cohortId=cohortId, sub.sec_now, sub.sec_type_now, sub.sec_rnd_now);
                } catch (err) {
                    console.log("BADNESS: Recovering from earlier corruption due to error between initializing cohort and initiliazeing corespongding data object");
                    design = CohortSettings.findOne( { 
                        cohortId : cohortId, 
                        sec : sub.sec_now, 
                        sec_rnd : sub.sec_rnd_now,
                    } );
                    return( { design, familiarCohort : false });
                }
            } else if (false || matching.selfMatching) {
                //console.log("self matching");
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
                        sec : sub.sec_now, 
                        sec_rnd : sub.sec_rnd_now }, 
                        { sort : { cohortId : 1, sec : -1, sec_rnd : -1 } }
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
                            design = Meteor.call("initializeCohort", cohortId, sub.sec_now, sub.sec_type_now, sub.sec_rnd_now);
                        } catch (err) {
                            console.log("BADNESS: Recovering from earlier corruption due to error between initializing cohort and initiliazeing corespongding data object 2nd time");
                            design = CohortSettings.findOne( { 
                                cohortId : cohortId, 
                                sec : sub.sec_now, 
                                sec_rnd : sub.sec_rnd_now,
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
                    console.assert( sub.sec_now === design.sec, "sanity7");
                    console.assert( sub.sec_rnd_now === design.sec_rnd, "sanity8");
                    console.assert( !_.isNil( design ) , "design is null?");
                    //sanity for existing subjects
                    if ( !_.isNil( lastDesign ) && familiarCohort ) { 
                        try {
                            //console.assert( sub.sec_now === lastDesign.sec || sub.sec_now === lastDesign.sec + 1 , "sanity3");
                            console.assert( sub.sec_rnd_now === lastDesign.sec_rnd + 1 || sub.sec_rnd_now === 0 , "sanity4");
                        } catch(err) {
                            //console.log(err, sub, lastDesign, design);
                            //console.log(err);
                        }
                    }
                } catch(err) {
                    console.log(err, lastDesign, sub, sub.sec_rnd_now, design);
                }

            }
            return( { design, familiarCohort } );
        };
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
                        "theData.cohortId" : design.cohortId, 
                        sec : design.sec, 
                        sec_rnd : design.sec_rnd 
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
                countInA = SubjectsData.find({ "theData.cohortId": design.cohortId, 
                    sec : design.sec, sec_rnd : design.sec_rnd, "theData.choice": "A" }).fetch().length;
                countInB = SubjectsData.find({ "theData.cohortId": design.cohortId, 
                    sec : design.sec, sec_rnd : design.sec_rnd, "theData.choice": "B" }).fetch().length;
                countInNoChoice = SubjectsData.find({ "theData.cohortId": design.cohortId, 
                    sec : design.sec, sec_rnd : design.sec_rnd, "theData.choice": "X" }).fetch().length;
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
Experiment.initializeCohort = function(newCohortId, newSection, newSectionType, newRound) {
    console.log("ASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGASDFASFDVSDFGAWRSFSBDCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASDFASFDVSDFGAWRSFSBDCGA");
    dat = Experiment.findSubsCohort( sub, lastDesign, Design.matching );
    //  http://stackoverflow.com/questions/18887652/are-there-private-server-methods-in-meteor
    //if (this.connection === null) { /// to make method private to server
    //console.log("initializeCohort", newCohortId, newSection, newSectionType, newRound );
    let newDesign = _.clone(Design);
    newDesign.filledCohort = 0;
    newDesign.completedCohort = false;
    newDesign.cohortId = newCohortId; // uid for designs, a unique one for each cohort
    newDesign.sec = newSection;
    newDesign.sec_type = newSectionType;
    newDesign.sec_rnd = newRound;
    CohortSettings.insert( newDesign );
    try {
        CohortSettings._ensureIndex({cohortId : 1, sec : 1, sec_rnd : 1 }, { unique : true } );
    } catch (err) {
        console.log("Data failed uniqueness: CohortSettings");
        throw(err);
    }
    return( newDesign );
    //} else {
    //throw(new Meteor.Error(500, 'Permission denied!'));
    //}
};
