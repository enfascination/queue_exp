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
        return([Meteor.subscribe('s_status')]);
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

Router.route('/start', function() {
    this.render('quizSectionTabPane');
    this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
}, {
});

Router.route('/experiment', function() {
    // main template
    this.render( 'expSectionTabPane' );

    // infobox template contingent on section
    let data = Router.options.data();
    if (data && data.currentSection.id != 'survey') {
        this.render( 'experimentInfo', { to : 'infoBox' } );
    } else {
        this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
    }
},{
    data : function() { // enrich the global data object in this section
        let data = Router.options.data();
        //console.log("router, experiment, data",data);
        let subData = Sess.subData();
        let design = Sess.design();
        if ( data && subData && design ) {
            data.subData = subData;
            data.design = design;
        }
        return( data );
    },
    waitOn : function () {
        return([
            Meteor.subscribe('s_status'),
            Meteor.subscribe('s_data'),
            Meteor.subscribe('designs'),
        ]);
    },
});

Router.route('/submitHIT', function() {
    this.render('submitHITSectionTabPane');
    this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
});

