/*jshint esversion: 6 */

var _ = require('lodash');
import '../api/design/models.js';
import { QueueAssigner } from '../server/assigners-custom.js';
import { Helper } from '../imports/lib/helper.js';

import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';


    Meteor.startup(function () {
        Batches.upsert({name: "main"}, {name: "main", active: true});
        let batch = TurkServer.Batch.getBatchByName("main");
        //batch.setAssigner(new TurkServer.Assigners.SimpleAssigner());
        batch.setAssigner( new QueueAssigner() );
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
        //if ( UserElements.experimenterView || TurkServer.isAdmin() ) {
            //return SubjectsData.find();
        //} else {
        if (this.userId) {
            return SubjectsData.find({ meteorUserId: this.userId }, { sort : { sec : -1, sec_rnd : -1 } });
        } else {
            //console.log("FALLBACK!");
            //return SubjectsData.find();
        }
        //}
    });
    Meteor.publish('s_status', function() {
        //if ( UserElements.experimenterView || TurkServer.isAdmin() ) {
            //return SubjectsStatus.find();
        //} else {
        if (this.userId) {
            //console.log("publishing", this.userId);
            return SubjectsStatus.find({ meteorUserId: this.userId });
        } else {
            //#console.log("FALLBACK2");
            //return SubjectsStatus.find();
        }
    });
    Meteor.publish('designs', function() {
        return CohortSettings.find( {}, { sort : { cohortId : -1, sec : -1, sec_rnd : -1 } } );
    });

    Meteor.methods({
        playerHasConnected: function( muid ) {
            let liveRound = SubjectsData.find({meteorUserId : muid, completedChoice : false}).fetch();
            try {
                console.assert( liveRound.length <= 1 );
            } catch(err) {
                console.log( err, liveRound );
            }
            //console.log("testrelogon", muid, SubjectsData.find({meteorUserId : muid, completedChoice : false}).fetch(), liveRound );
            return( liveRound );
        },
        // this will createa a new SubjectStatus object
        initializeSubject: function( idObj ) {

            SubjectsStatus.insert( {
                userId: idObj.assignmentId,
                meteorUserId: idObj.userId,
                tookQuiz: 3,  // set back to 0
                passedQuiz: true,  ///SET  back to false
                completedExperiment: false,
                tsAsstId: idObj.asstId,
                tsBatchId: idObj.batchId,
                tsGroupId: "undefined",
                mtHitId: idObj.hitId,
                mtAssignmentId: idObj.assignmentId,
                mtWorkerId: idObj.workerId,
                sec_now: 0,
                sec_rnd_now: 0,
                sec_rnd_stg_now: 0,
            } );

            //ensure uniqueness
            SubjectsStatus._ensureIndex({userId : 1}, { unique : true } );
        },
        // initialize cohort should always have been called before this function initializeRound
        // this will create a new SubjectsData object
        // it will update and may create a new CohortSettings object
        initializeRound: function( sub, lastDesign ) {
            let subjectPos, countInA, countInB, countInNoChoice, probeDesign, maxCohortId, design, cohortId;

            if (_.isString(sub)) { 
                // sub can be passed as a collection or a meteor.userId()
                // but it should end up as a collection result
                sub = SubjectsStatus.findOne({meteorUserId:sub});
            }

            // cases:
            // as the very first subject in the system (create a new design object)
            // im entering or continuing in the experiment 
            //      as the first subject in my cohort (create a new design object)
            //      as a subsequent subject (use an existing design object)
            probeDesign = CohortSettings.findOne( {}, 
                { sort : { cohortId : -1, sec : -1, sec_rnd : -1 } });

            // initialize player objects; start with determining state
            if ( _.isNil( probeDesign ) ) { // server has been reset and there are no design in database
                cohortId = 0;
                Meteor.call("initializeCohort", cohortId, sub.sec_now, sub.sec_rnd_now, function(err,data) {
                    if (err) { throw( err ); }
                    design = data;
                });
                subjectPos = 1;
                countInA = 0;
                countInB = 0;
                countInNoChoice = 0;
                //console.log("First round of install", design);
            } else {
                // now try to get a design for the right conditions, still not knowing my cohortId
                design = CohortSettings.findOne( { 
                    $where: "this.filledCohort < this.maxPlayersInCohort", 
                    sec : sub.sec_now, 
                    sec_rnd : sub.sec_rnd_now }, 
                    { sort : { cohortId : -1, sec : -1, sec_rnd : -1 } }
                );

                if ( _.isNil(design) ) { // need to create a new cohort objects
                    maxCohortId = probeDesign.cohortId;
                    if ( sub.sec_rnd_now === 0 ) {
                        cohortId = maxCohortId + 1;
                    } else {
                        cohortId = maxCohortId;
                    }
                    Meteor.call("initializeCohort", cohortId, sub.sec_now, sub.sec_rnd_now, function(err,data) {
                        if (err) { throw( err ); }
                        design = data;
                    });
                    subjectPos = 1;
                    countInA = 0;
                    countInB = 0;
                    countInNoChoice = 0;
                    //console.log("First player in cohort/section/round", design);
                } else {
                    // if i made it in here, then design defined in this block is the design I want to use and i want its info
                    //    this will be the case if I'm entering a cohort as a non-first person, regardles of the round i'm enetering in
                    design = design;
                    cohortId = design.cohortId;
                    //sanity
                    if ( !_.isNil( lastDesign ) ) { 
                        try {
                            console.assert( cohortId === lastDesign.cohortId , "sanity2");
                            console.assert( sub.sec_now === lastDesign.sec || sub.sec_now === lastDesign.sec + 1 , "sanity3");
                            console.assert( sub.sec_rnd_now === lastDesign.sec_rnd + 1 || sub.sec_rnd_now === 0 , "sanity4");
                        } catch(err) {
                            console.log(err, sub, lastDesign, design);
                        }
                    }
                    /// previous subject  who isn't the main player
                    let previousSubject = SubjectsData.findOne( {
                        meteorUserId : { $ne : sub.meteorUserId }, 
                        cohortId : design.cohortId, 
                        sec : design.sec, 
                        sec_rnd : design.sec_rnd 
                    }, { sort : {  cohortId : -1, queuePosition : -1 } });
                    if (_.isNil(previousSubject)) {
                        throw( "something is seriously the matter: you can't play against yourself, but there isn't someone else" );
                    }
                    subjectPos = previousSubject.queuePosition + 1;
                    countInA = SubjectsData.find({ cohortId: design.cohortId, choice: "A" }).fetch().length;
                    countInB = SubjectsData.find({ cohortId: design.cohortId, choice: "B" }).fetch().length;
                    countInNoChoice = SubjectsData.find({ cohortId: design.cohortId, choice: "X" }).fetch().length;
                    //console.log( "Found round for continuing player", design );
                }
            }
            try {
                console.assert( _.isNil( lastDesign ) || sub.sec_rnd_now > 0 , "sanity1");
                console.assert( cohortId === design.cohortId , "sanity6");
                console.assert( sub.sec_now === design.sec, "sanity7");
                console.assert( sub.sec_rnd_now === design.sec_rnd, "sanity8");
                console.assert( !_.isNil( design ) , "design is null?");
            } catch(err) {
                console.log(err, lastDesign, sub, sub.sec_rnd_now, design);
            }

            SubjectsData.insert( {
                userId: sub.userId,
                meteorUserId: sub.meteorUserId,
                cohortId: cohortId,
                queuePosition: subjectPos,
                queuePositionFinal: -1,
                choice: 'X',
                earnings1: design.endowment,
                earnings2: 0,
                totalPayment: 0,
                theTimestamp: Date.now(),
                queueCountA: countInA,
                queueCountB: countInB,
                queueCountNoChoice: countInNoChoice,
                sec: sub.sec_now,
                sec_rnd: sub.sec_rnd_now,
                completedChoice: false,
            } );
            //ensure uniqueness
            SubjectsData._ensureIndex({userId : 1, cohortId : 1, sec : 1, sec_rnd : 1}, { unique : true } );
            CohortSettings.update({
                cohortId : design.cohortId, 
                sec : sub.sec_now, 
                sec_rnd : sub.sec_rnd_now,
            }, {
                $set: {
                    filledCohort : design.filledCohort + 1,
                },
            });

            let ss = SubjectsStatus.findOne({ meteorUserId: sub.meteorUserId });
            let sd = SubjectsData.findOne({ meteorUserId: sub.meteorUserId, cohortId: cohortId, sec: design.sec, sec_rnd : design.sec_rnd });
            let ct = CohortSettings.findOne({ cohortId: cohortId, sec: design.sec, sec_rnd : design.sec_rnd });
            return( { "s_status" : ss, "s_data" : sd, "design" : ct } );
        },
        // this modfiies a SubjectsStatus object
        addGroupId: function( meteorUserId, groupId ) {
            if ("undefined" in SubjectsStatus.find({meteorUserId: meteorUserId}, { fields: {'tsGroupId':1} }).fetch()) {
                let res = SubjectsStatus.update({meteorUserId: meteorUserId}, { $set: {tsGroupId : groupId} });
                //console.log(res);
            }
        },
        // this updates a SubjectsData object
        // this updates a SubjectsStatus object
        submitQueueChoice: function(muid, cohortId, section, round, choice, lastRound, design) {
            let next_section, next_round, theChoice, theEarnings;
            if ( lastRound ) {
                next_section = section + 1;
                next_round = 0;
            } else {
                next_section = section;
                next_round = round + 1;
            }

            //console.log("submitchoice", muid, cohortId, round, section, next_round, next_section, design.sequence, choice );

            if (choice === "A") {
                theChoice = "A";
                theEarnings = design.endowment - design.queueCosts.A;
            } else if (choice === "B") {
                theChoice = "B";
                theEarnings = design.endowment - design.queueCosts.B;
            }

            SubjectsData.update({ meteorUserId: muid , cohortId : cohortId, sec : section, sec_rnd : round }, {
                $set: {
                    choice: theChoice,
                    earnings1: theEarnings,
                    completedChoice : true,
                },
            });
            SubjectsStatus.update({meteorUserId: muid }, {
                $set: {
                    sec_now: next_section,
                    sec_rnd_now: next_round,
                },
            });
            //let ss = SubjectsStatus.findOne({ meteorUserId: muid });
            //let sd = SubjectsData.findOne({ meteorUserId: muid , cohortId : cohortId, sec : section, sec_rnd : round });
            //return({ "s_status" : ss, "s_data" : sd });
        },
        // updates a CohortSettings object
        completeCohort: function(design) {
            let cohortId = design.cohortId;
            let cohortFin = SubjectsData.find({
                cohortId : cohortId, 
                sec: design.sec,
                sec_rnd: design.sec_rnd,
                completedChoice: true,
            });
            let cohortUnfin = SubjectsData.find({
                cohortId : cohortId, 
                sec: design.sec,
                sec_rnd: design.sec_rnd,
                completedChoice: false,
            });
            if (cohortFin.count() >= design.maxPlayersInCohort ) {
                // get rid of old cohort (make it outdated/complete)
                CohortSettings.update({ cohortId: cohortId, sec: design.sec, sec_rnd: design.sec_rnd }, {
                    $set: { 
                        completedCohort: true,
                    },
                }//, {multi: true}  //d ont' want to need this.
                );
                try {
                    console.assert(design.maxPlayersInCohort == design.filledCohort, "sanity6" );
                } catch(err) {
                    console.log(err);
                }
            } else if ( cohortFin.count() + cohortUnfin.count() === design.maxPlayersInCohort) {
                //let sub = SubjectsData.findOne({ cohortId : cohortId, sec: design.sec, sec_rnd: design.sec_rnd }, 
                    //{ sort : { cohortId : -1, sec : -1, sec_rnd : -1 } });
                for ( let sub of cohortUnfin.fetch() ) {
                    // print out subjects that, later, I'll want (need) to address manually.
                    //console.log( sub.userId );
                }
            } else {
                // cohort still in progress
            }
            return( CohortSettings.findOne({ cohortId: cohortId, sec: design.sec, sec_rnd: design.sec_rnd }) );
        },
        // updates a bunch of SubjectsData objects
        calculateQueueEarnings: function(aDesign) {
            let queueasubjects, queuebsubjects, positionfinal, earnings2, totalpayment, asst, cohortId;
            cohortId = aDesign.cohortId;
            queueASubjects = SubjectsData.find( {
                cohortId : cohortId, choice : "A", sec : aDesign.sec, sec_rnd : aDesign.sec_rnd 
                }, {sort : { queuePosition : 1 } } ).fetch() ;
            queueBSubjects = SubjectsData.find( {
                cohortId : cohortId, choice : "B", sec : aDesign.sec, sec_rnd : aDesign.sec_rnd 
                }, {sort : { queuePosition : 1 } } ).fetch() ;
            positionFinal = 1;
            for ( let sub of _.concat(queueASubjects, queueBSubjects ) ) {
                // maybe figure out here how to recover assignment from an old passed subject;
                earnings2 = aDesign.pot - ( (positionFinal-1) * aDesign.positionCosts );
                totalPayment = sub.earnings1 + earnings2;
                SubjectsData.update({cohortId: cohortId, userId : sub.userId, sec : aDesign.sec, sec_rnd : aDesign.sec_rnd }, {
                    $set: { 
                        earnings2: earnings2, 
                        totalPayment: totalPayment, 
                        queuePositionFinal : positionFinal,
                    },
                });
                subbk = SubjectsStatus.findOne({ meteorUserId: sub.meteorUserId });
                asst = TurkServer.Assignment.getAssignment( subbk.tsAsstId );
                asst.setPayment( totalPayment );
                positionFinal += 1;
            }
        },
        // updates a SubjectStatus object
        goToExitSurvey: function() {
            SubjectsStatus.update({meteorUserId: Meteor.userId() }, {
                $set: {
                    completedExperiment: true,
                },
            });
            TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
        },
        // this takes previous deisgn and increments on it, or takes nothign and makes firs deisgn on global
        // Creates a new CohortSettings object
        'initializeCohort': function(newCohortId, newSection, newRound ) {
            //  http://stackoverflow.com/questions/18887652/are-there-private-server-methods-in-meteor
            //if (this.connection === null) { /// to make method private to server
                let newDesign = _.clone(Design);
                newDesign.filledCohort = 0;
                newDesign.completedCohort = false;
                newDesign.cohortId = newCohortId; // uid for designs, a unique one for each cohort
                newDesign.sec = newSection;
                newDesign.sec_rnd = newRound;
                CohortSettings.insert( newDesign );
                CohortSettings._ensureIndex({cohortId : 1, sec : 1, sec_rnd : 1 }, { unique : true } );
                return( newDesign );
            //} else {
                //throw(new Meteor.Error(500, 'Permission denied!'));
            //}
        },
    });
