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
                currentSectionName : sub.sec_now,
                currentTab : sub.sec_now,
                subStat : sub,
                expSection : DesignSequence[ sub.sec_now ],
                thisSection : DesignSequence[ sub.sec_now ],
                currentSection : DesignSequence[ sub.sec_now ],
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
}, {
});

Router.route('/experiment', function() {
    this.render('expSectionTabPane2');
},{
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
});

