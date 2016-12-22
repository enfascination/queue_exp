/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';

import '../api/design/models.js';
import { Schemas } from '../api/design/schemas.js';
import { Helper } from '../imports/lib/helper.js';

import { QueueAssigner } from './assigners-custom.js';

import { Experiment } from './exp_instpref.js';
import { QuestionData } from '../imports/startup/experiment_prep_instpref.js';

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
            //return SubjectsStatus.find();
        }
    });
    Meteor.publish('designs', function() {
        return CohortSettings.find( {}, { sort : { cohortId : -1, sec : -1, sec_rnd : -1 } } );
    });
    Meteor.publish('questions', function() {
        return Questions.find({ meteorUserId: this.userId });
    });

    Meteor.methods({
        // this is a reload detector.  if the player has connected before, they will have a data object in progress.
        playerHasConnectedBefore: function( muid ) {
            //console.log("check prior (data) connections",SubjectsStatus.findOne({meteorUserId : muid}),  SubjectsData.find({meteorUserId : muid}, { $sort: {sec : -1, sec_rnd : -1 }}).fetch() );
            let subjectDatas = SubjectsData.find({meteorUserId : muid, completedChoice : false }).fetch();
            try {
                console.assert( subjectDatas.length <= 1, "in playerHasConnectedBefore" );
            } catch(err) {
                console.log( err, subjectDatas );
            }
            //console.log("testrelogon", muid, SubjectsData.find({meteorUserId : muid, completedChoice : false}).fetch(), subjectDatas );
            return( { "status" : SubjectsStatus.findOne( {meteorUserId : muid }), "data" : subjectDatas } );
        },
        // this will createa a new SubjectStatus object
        initializeSubject: function( idObj ) {

            // experiment-specific logic
           

            SubjectsStatus.insert( {
                userId: idObj.assignmentId,
                meteorUserId: idObj.userId,
                quiz: {"passed" : false, "failed" : false, "triesLeft" : Design.maxQuizFails },
                completedExperiment: false,
                tsAsstId: idObj.asstId,
                tsBatchId: idObj.batchId,
                tsGroupId: "undefined",
                mtHitId: idObj.hitId,
                mtAssignmentId: idObj.assignmentId,
                mtWorkerId: idObj.workerId,
                sec_now: 'instructions',
                sec_type_now: 'quiz',
                sec_rnd_now: 0,
                sec_rnd_stg_now: 0,
                readyToProceed: false,
                totalEarnings: 0,
            } );

            //ensure uniqueness
            SubjectsStatus._ensureIndex({userId : 1, meteorUserId : 1}, { unique : true } );
        },
        addSubjectQuestions : function( sub, sec ) {
            //import { QuestionData } from '../../imports/startup/experiment_prep_instpref.js';
            //let idxs = _.shuffle( _.range( questions.length ) );
            console.log("addQuestions", sec);
            if (sec === "experiment1" || sec === "experiment2" ) {
                let payoffs, payoffYou, payoffOther, payoffsBefore, payoffsDiff = _.times(8,()=>0);
                let payoffOrderPlayers = ['You', 'Other'];
                let payoffOrder = ['Top,Left', 'Top,Right', 'Bottom,Left', 'Bottom,Right'];
                let playerPosition = "Side";
                if (sec === "experiment1" ) {
                    // strictly ordinal games (without replacement)
                    let rIndices = _.concat(_.shuffle(_.range(4)), _.shuffle(_.range(4,8)));
                    payoffs = rIndices.map( (i)=> _.concat(_.range(0,4), _.range(0,4))[i]+1);
                    // loosely ordinal games (with replacement)
                    //let payoffs = _.concat( _.times(4, ()=>_.sample([1, 2, 3, 4]) ), _.times(4, ()=>_.sample([1, 2, 3, 4]) ) );
                } else {
                    let qPre = Questions.findOne({
                        meteorUserId : sub.meteorUserId,
                        sec_type : 'experiment',
                        sec : 'experiment1',
                    });
                    payoffsBefore = qPre.payoffs;
                    payoffs = QuestionData.tweakGame( payoffsBefore, switchOnly=true );
                    payoffsDiff = _.map( _.zip(payoffsBefore, payoffs), (e)=> _.subtract(e[1], e[0]) );
                }
                payoffYou = _.slice(payoffs, 0,4);
                payoffOther = _.slice(payoffs,4,8);
            }
            QuestionData.questions.forEach( function(q) {
                if (q.sec === sec) {
                    if (sec === "experiment1" || sec === "experiment2" ) {
                        q.payoffOrder = payoffOrder;
                        q.payoffOrderPlayers = payoffOrderPlayers;
                        q.playerPosition = playerPosition;
                        q.payoffs = payoffs;
                        q.payoffYou = payoffYou;
                        q.payoffOther = payoffOther;
                        q.payoffsBefore = payoffsBefore;
                        q.payoffsDiff = payoffsDiff;
                    } 
                    q.meteorUserId = sub.meteorUserId;
                    Questions.insert(q);
                }
            });
        },
        // initialize cohort should always have been called before this function initializeRound
        // this will create a new SubjectsData object
        // it will update and may create a new CohortSettings object
        initializeRound: function( sub, lastDesign ) {
            console.log("initRound");
            let design, theData;

            if (_.isString(sub)) { 
                // sub can be passed as a collection or a meteor.userId()
                // but it should end up as a collection result
                sub = SubjectsStatus.findOne({meteorUserId:sub});
            }

            //  experiment specific
            // retrieve the appropriiate design for the subject in this state
            dat = Experiment.findSubsCohort( sub, lastDesign, Design.matching );
            design = dat.design;

            if( design.sec_rnd === 0 ) {
                Meteor.call("addSubjectQuestions", sub, design.sec );
            }

            //  experiment specific
            // retrieve the appropriiate data for the subject in this state
            theData = Experiment.findSubsData( sub, lastDesign, dat, Design.matching );
            //console.log("outerinit", theData);

            //console.log("new subject data", theData);
            SubjectsData.insert( {
                userId: sub.userId,
                meteorUserId: sub.meteorUserId,
                sec: sub.sec_now,
                sec_type: sub.sec_type_now,
                sec_rnd: sub.sec_rnd_now,
                completedChoice: false,
                theTimestamp: Date.now(),
                theData : theData,
            } );
            //ensure uniqueness
            //SubjectsData._ensureIndex({userId : 1, meteorUserId : 1, sec : 1, sec_rnd : 1}, { unique : true } );
            CohortSettings.update({
                cohortId : design.cohortId, 
                sec : sub.sec_now, 
                sec_rnd : sub.sec_rnd_now,
            }, {
                $set: {
                    filledCohort : design.filledCohort + 1,
                },
            });

            let ss, sd, ct;
            ss = SubjectsStatus.findOne({ meteorUserId: sub.meteorUserId });
            sd = SubjectsData.findOne({ 
                meteorUserId: sub.meteorUserId, "theData.cohortId": design.cohortId, sec: design.sec, sec_rnd : design.sec_rnd 
            });
            ct = CohortSettings.findOne({ cohortId: design.cohortId, sec: design.sec, sec_rnd : design.sec_rnd });
            return( { "s_status" : ss, "s_data" : sd, "design" : ct } );
        },
        //findSubsCohort: function(sub, lastDesign) {
            //return(Experiment.findSubsCohort(sub, lastDesign));
        //},
        // this modfiies a SubjectsStatus object
        addGroupId: function( meteorUserId, groupId ) {
            if ("undefined" in SubjectsStatus.find({meteorUserId: meteorUserId}, { fields: {'tsGroupId':1} }).fetch()) {
                let res = SubjectsStatus.update({meteorUserId: meteorUserId}, { $set: {tsGroupId : groupId} });
                //console.log(res);
            }
        },
        // this updates a SubjectsData object
        submitExperimentChoice: function(muid, sec, sec_rnd, theData) {
            Experiment.submitExperimentChoice(muid, sec, sec_rnd, theData);
            // no return value
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
            if ( sub_old.sec_now === "quiz" ) {
                // to experiment
                let asst = TurkServer.Assignment.getAssignment( sub_old.tsAsstId );
                let batch = TurkServer.Batch.getBatchByName( Design.batchName );
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
            } else if ( sub_old.sec_now === "survey" ) {
                SubjectsStatus.update({ meteorUserId: muid }, {
                    $set: {
                        completedExperiment: true,
                    },
                });
                // to exit survey/submitHIT
                Meteor.call('goToExitSurvey', Meteor.userId());
                entered = 3;
            }

            sub = SubjectsStatus.findOne({ meteorUserId: muid });
            //console.log("end of advancesection", entered, sub.sec_now );
            return( sub );
        },
        // updates a CohortSettings object
        tryToCompleteCohort: function(design) {
            let completedCohort = false;
            let cohortId = design.cohortId;
            
            // experiment-specific logic
            let cohortFin = SubjectsData.find({
                "theData.cohortId" : cohortId, 
                sec: design.sec,
                sec_rnd: design.sec_rnd,
                completedChoice: true,
            });
            let cohortUnfin = SubjectsData.find({
                "theData.cohortId" : cohortId, 
                sec: design.sec,
                sec_rnd: design.sec_rnd,
                completedChoice: false,
            });

            //console.log( "cohort completion", cohortFin.count(), cohortUnfin.count(), design.maxPlayersInCohort );
            if (cohortFin.count() >= design.maxPlayersInCohort ) {
                // get rid of old cohort (make it outdated/complete)
                completedCohort = true;
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

                //if end of queue, calculate all earnings
                Meteor.call( 'calculateExperimentEarnings', design );

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

            //return( design  );
        },
        // updates a bunch of SubjectsData objects
        calculateExperimentEarnings: function(aDesign) {
            let queueasubjects, queuebsubjects, positionfinal, earnings2, totalpayment, asst, cohortId;
            cohortId = aDesign.cohortId;

            // experiment-specific logic
            queueASubjects = SubjectsData.find( {
                "theData.cohortId" : cohortId, "theData.choice" : "A", sec : aDesign.sec, sec_rnd : aDesign.sec_rnd 
                }, {sort : { "theData.queuePosition" : 1 } } ).fetch() ;
            queueBSubjects = SubjectsData.find( {
                "theData.cohortId" : cohortId, "theData.choice" : "B", sec : aDesign.sec, sec_rnd : aDesign.sec_rnd 
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
        },
        goToExitSurvey: function( muid ) {
            if (TurkServer.Instance.currentInstance()) {
                TurkServer.Instance.currentInstance().teardown(returnToLobby = true);
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
        'initializeCohort': function(newCohortId, newSection, newSectionType, newRound ) {
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
        },
        insertSurveyQuestion: function(muid, theData ) {
            let sub = SubjectsStatus.findOne({ meteorUserId : muid });
            //console.log("insertSurveyQuestion", sub);
            let id = SubjectsData.insert( {
                userId: sub.userId,
                meteorUserId: sub.meteorUserId,
                sec: sub.sec_now,
                sec_type: sub.sec_type_now,
                sec_rnd: 0,
                theData: theData,
                completedChoice : true,
                theTimestamp: Date.now(),
            } );
            return( SubjectsData.findOne( id ) );
        },
        // server side helper
        updateSubjectQuestion : function(muid, id, theData) {
                let output = Questions.update({_id : id, meteorUserId : muid}, {$set : theData});
        },
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
        }
    });
