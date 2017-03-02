/*jshint esversion: 6 */
///*jshint esversion: 6, bitwise:true, browser:true, curly:true, eqeqeq:true, evil:true, forin:true, indent:2, latedef: true, maxerr:50, noarg:true, noempty:true, plusplus:true, regexp:false, undef:true, white:true */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
//import { Amplify } from 'meteor/amplify';

export const Sess = {
    // getter for subject
    subStat : function () {
            let sub = SubjectsStatus.findOne( { meteorUserId : Meteor.userId()} );
            if ( !_.isNil(sub) ) {
                return( sub );
            } else {
                //return(amplify.store("s_status") );
            }
    },
    subData : function () {
            // there's an assumption hardcoded here, that the data i'll want for a subject is the most recent data.  
            //   I don't know if that's true, but that's what's here.
            let sd = SubjectsData.find({meteorUserId: Meteor.userId()}, { sort : { theTimestamp : -1, sec : -1, sec_rnd : -1 } } ).fetch();
            if ( !_.isNil(sd) ) {
                return( sd );
            } else {
                //return(amplify.store("s_data") );
            }
    },
    setClientSub : function ( sub ) {
        if (sub) {
            //console.log("setclientsub", sub["data"], sub.data);
            ////amplify.store("s_status", sub.status );
            //amplify.store("s_data", sub.data );
        }
    },
    design : function () {
            let cs;
            // there's an assumption hardcoded here, that the data i'll want for a subject is the most recent data.  
            //   I don't know if that's true, but that's what's here.
            let sb = SubjectsStatus.findOne({meteorUserId: Meteor.userId()} );
            if (sb && (sb.sec_now === "quiz"  || sb.sec_now === "survey" || sb.sec_now === "earningsReport" || sb.sec_now === "submitHIT" ) ) {
                /// cohort isn't a meaningful idea outside of the main experiment
                return(Design);
            }
            if ( !_.isNil( sb ) ) {
                cs = CohortSettings.findOne(
                    { cohortId: sb.cohort_now}, 
                    { } );
            }
            if ( !_.isNil( cs ) ) {
                //console.log("Sess.design here");
                return( cs );
            } else {
                //return amplify.store("design");
            }
            //console.log("Sess.design not here", sb);
    },
    setClientDesign : function (des) {
        if (des) {
            //amplify.store("design", des);
        }
    },
    quizTriesLeft : function (uid) {
            if( SubjectsStatus.findOne({ "meteorUserId" : uid }) ) {
                return( SubjectsStatus.findOne({ "meteorUserId" : uid }).quiz.triesLeft );
            }
    },
};
