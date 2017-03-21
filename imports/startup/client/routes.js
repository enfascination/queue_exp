/*jshint esversion: 6 */

var _ = require('lodash');
import { Router } from 'meteor/iron:router';
import { Sess } from '../../lib/quick-session.js';
import { Helper } from '../../lib/helper.js';

Router.configure({
    layoutTemplate: 'main',
    layout: 'main',
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
    waitOn : function () {
        //return([Meteor.subscribe('s_status')]);
        return([ Meteor.subscribe('s_status'), ]);
    },
    onAfterAction : function() {
        // for some reaosn this code breaks everyting: it stops the right tab from activating on reload
        //let sub = Sess.subStat();
        //console.log("onAfterActionmain", this);
        //if ( sub ) {
            //Helper.updateNavBar( sub.sec_now, sub.sec_now );
        //}
    },
});

Router.route('/', function() {
    this.render('home');
});

Router.route('start', function() {
    var stage = _.toInteger( this.params.stage );
        console.log("in instructions rendering", this.params);
    this.render( 'expGeneralInfoBox', { to : 'infoBox'} );
    if (stage < 1) { stage = 1; }
    if (stage >= 8) { stage = 1; }
    if (stage === 1) {
        this.render( 'instPrefInstructions', { to : 'instructions', data: stage } );
    } else if (stage === 7) {
        this.render('quiz', { to : 'instructions', data: stage });
    } else {
        this.render( 'instructions' + _.toString( stage ), { to : 'instructions', data: stage } );
    }
}, {
    path: '/start/:stage',
    data : function() { // enrich the global data object in this section
        let data = Router.options.data();
        console.log("in instructions data rendering", this.params, this.params.query);
        if ( data ) {
            let sub = data.subStat;
            let qs = Questions.find({ meteorUserId : sub.meteorUserId, sec: sub.sec_now, sec_rnd : sub.sec_rnd_now }, {$sort : { order : 1 }});
            data.questionsColl = qs;
            data.stage = this.params.stage;
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

    let rnd = data.subStat.sec_rnd_now 
    if (data && rnd === 0 ) {
        this.render( 'instPrefGame0', { to : 'instPrefGame' } );
    } else if (data && rnd === 1 ) {
        this.render( 'instPrefGame1', { to : 'instPrefGame' } );
    } else if (data && rnd === 2 ) {
        this.render( 'instPrefGame2', { to : 'instPrefGame' } );
    } else if (data && rnd === 3 ) {
        this.render( 'instPrefGame3', { to : 'instPrefGame' } );
    } else if (data && rnd === 4 ) {
        this.render( 'instPrefGame4', { to : 'instPrefGame' } );
    }
},{
    data : function() { // enrich the global data object in this section
        let data = Router.options.data();
        let subData = Sess.subData();
        let design = Sess.design();
        if ( data && subData && design ) {
            let subStat = data.subStat;
            data.subData = subData;
            data.design = design;
            let qs = Questions.find({ meteorUserId : subStat.meteorUserId, sec: subStat.sec_now, sec_rnd : subStat.sec_rnd_now }, {$sort : { order : 1 }});
            data.questionsColl = qs;
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
});
