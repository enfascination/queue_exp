/*jshint esversion: 6, bitwise:true, browser:true, curly:true, eqeqeq:true, evil:true, forin:true, indent:2, latedef: true, maxerr:50, noarg:true, noempty:true, plusplus:true, regexp:false, undef:true, white:true */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';
import { Amplify } from 'meteor/amplify';

export const Sess = {
    // getter for subject
    subStat : function () {
        let sub = SubjectsStatus.findOne( { meteorUserId : Meteor.userId()} );
        if ( !_.isNil(sub) ) {
            return( sub );
        } else {
            return(amplify.store("s_status") );
        }
    },
    subData : function () {
        // there's an assumption hardcoded here, that the data i'll want for a subject is the most recent data.  
        //   I don't know if that's true, but that's what's here.
        let sd = SubjectsData.findOne({meteorUserId: Meteor.userId()}, { sort : { sec : -1, sec_rnd : -1 } } );
        if ( !_.isNil(sd) ) {
            return( sd );
        } else {
            return(amplify.store("s_data") );
        }
    },
    sub : function () {
        let sub = SubjectsStatus.findOne( { meteorUserId : Meteor.userId()} );
        // there's an assumption hardcoded here, that the data i'll want for a subject is the most recent data.  
        //   I don't know if that's true, but that's what's here.
        let sd = SubjectsData.findOne({meteorUserId: Meteor.userId()}, { sort : { sec : -1, sec_rnd : -1 } } );
        if ( !_.isNil(sub) && !_.isNil(sd) ) {
            return( _.assign( sub, sd ) );
        } else {
            return(amplify.store("subject") );
        }
    },
    setClientSub : function ( sub ) {
        if (sub) {
            //console.log("setclientsub", sub["data"], sub.data);
            amplify.store("subject", _.assign( sub.status, sub.data ) );
            amplify.store("s_status", sub.status );
            amplify.store("s_data", sub.data );
        }
    },
    design : function () {
        let cs;
        // there's an assumption hardcoded here, that the data i'll want for a subject is the most recent data.  
        //   I don't know if that's true, but that's what's here.
        let sd = SubjectsData.findOne({meteorUserId: Meteor.userId()}, { sort : { sec : -1, sec_rnd : -1 } } );
        if ( !_.isNil( sd ) ) {
            cs = CohortSettings.findOne({ cohortId: sd.cohortId, sec : sd.sec, sec_rnd : sd.sec_rnd }, { sort : { sec : -1, sec_rnd : -1 } } );
        }
        if ( !_.isNil( cs ) ) {
            return( cs );
        } else {
            return amplify.store("design");
        }
    },
    setClientDesign : function (des) {
        if (des) {
            amplify.store("design", des);
        }
    },
    quizTriesLeft : function (uid) {
        if( SubjectsStatus.findOne({ "meteorUserId" : uid }) ) {
            return( SubjectsStatus.findOne({ "meteorUserId" : uid }).quiz.triesLeft );
        }
    },
    wipeClientState : function() {
        amplify.store("subject", null);
        amplify.store("design", null);
    },
}

