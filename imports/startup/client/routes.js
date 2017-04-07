/*jshint esversion: 6 */

var _ = require('lodash');
import { Router } from 'meteor/iron:router';
import { Sess } from '../../lib/quick-session.js';
import { Helper } from '../../lib/helper.js';

Router.configure({
    loadingTemplate: 'loading',
    data: function () {
        let sub = Sess.subStat();
        if ( sub ) {
                return({
                    currentTab : sub.sec_now,
                    subStat : sub,
                    currentSection : DesignSequence[ sub.sec_now ],
                    design : Design,
                }); 
        }
    },
});

Router.route('/', function() {
    this.render('home');
}, {
});

Router.route('start', function() {
    let stage = _.toInteger( this.params.stage );
        //console.log("in instructions rendering", this.params);
    this.render( 'expGeneralInfoBox', { to : 'infoBox'} );
    let data = Router.options.data();
    //if (data.currentSection.id === 'quiz') {
        //stage = 1;
    //}
    if (stage <= 1) {
        //this.render( 'instPrefInstructions', { to : 'instructions'} );
        stage = 1;
        this.render( 'instructions' + _.toString( stage ), { to : 'instructions' } );
    } else if (stage >= 3) {
        this.render('quiz', { to : 'instructions'});
    } else { //numbers between 1 and 6
        this.render( 'instructions' + _.toString( stage ), { to : 'instructions' } );
    }
}, {
    layoutTemplate: 'main',
    path: '/start/:stage',
    waitOn : function () {
        return([
            Meteor.subscribe('s_status'),
        ]);
    },
});

Router.route('/quiz', function() {
    this.render( 'quizSectionTabPane' );
}, {
    layoutTemplate: 'main',
    //path: '/quiz',
    data : function() { // enrich the global data object in this section
        let data = Router.options.data();
        //console.log("in instructions data rendering", this.params, this.params.query);
        if ( data ) {
            let sub = data.subStat;
            let qs = Questions.find({ meteorUserId : sub.meteorUserId, mtAssignmentId : sub.mtAssignmentId, sec: sub.sec_now, sec_rnd : sub.sec_rnd_now }, {$sort : { order : 1 }});
            data.questionsColl = qs;
        }
        return( data );
    },
    waitOn : function () {
        return([
            Meteor.subscribe('s_status'),
            Meteor.subscribe('questions'),
        ]);
    },
});
Router.route('/experiment', function() {
    // main template
    this.render( 'expSectionTabPane' );

    // infobox template contingent on section
    let data = Router.options.data();
    if (data && (data.currentSection.id === 'survey')) {
        this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
    } else if (data && (data.currentSection.id === 'earningsReport')) {
        this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
    } else {
        this.render( 'experimentInfo', { to : 'infoBox' } );
    }

    if (data && data.subStat) {
        let rnd = data.subStat.sec_rnd_now;
        if (rnd === 0 ) {
            this.render( 'instPrefGame0', { to : 'instPrefGame' } );
        } else if (rnd === 1 ) {
            this.render( 'instPrefGame1', { to : 'instPrefGame' } );
        } else if (rnd === 2 ) {
            this.render( 'instPrefGame2', { to : 'instPrefGame' } );
        } else if (rnd === 3 ) {
            this.render( 'instPrefGame3', { to : 'instPrefGame' } );
        } else if (rnd === 4 ) {
            this.render( 'instPrefGame4', { to : 'instPrefGame' } );
        }
    }
},{
    layoutTemplate: 'main',
    data : function() { // enrich the global data object in this section
        let data = Router.options.data();
        let design = Sess.design();
        if ( data && design ) {
            let subStat = data.subStat;
            let subData = SubjectsData.find({meteorUserId: Meteor.userId(), mtAssignmentId : subStat.mtAssignmentId}, { sort : { theTimestamp : -1, sec : -1, sec_rnd : -1 } } ).fetch();
            if ( subData && subStat ) {
                data.subData = subData;
                data.design = design;
                let qs = Questions.find({ meteorUserId : subStat.meteorUserId, mtAssignmentId : subStat.mtAssignmentId, sec: subStat.sec_now, sec_rnd : subStat.sec_rnd_now }, {$sort : { order : 1 }});
                data.questionsColl = qs;
            }
            //console.log("router, experiment, data inside",qs.fetch());
        }
        //console.log("router, experiment, data",data, subData , design );
        return( data );
    },
    waitOn : function () {
        return([
            Meteor.subscribe('s_status'),
            Meteor.subscribe('s_data'),
            Meteor.subscribe('designs'),
            Meteor.subscribe('questions'),
        ]);
    },
});

Router.route('/submitHIT', function() {
    this.render('submitHITSectionTabPane');
    this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
}, {
    layoutTemplate: 'main',
    waitOn : function () {
        //return([Meteor.subscribe('s_status')]);
        return([ Meteor.subscribe('s_status'), ]);
    },
});
