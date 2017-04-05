/*jshint esversion: 6 */

var _ = require('lodash');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Router } from 'meteor/iron:router';

import { Sess } from '../../imports/lib/quick-session.js';

Session.set('tutorialEnabled', false);
let tutorialSteps1 = [
  {
    template: Template.tutorial_step1,
  },
  {
    template: Template.tutorial_step2,
  },
  {
    template: Template.tutorial_step3,
    spot: ".expTabs",
  },
  {
    template: Template.tutorial_step4,
    spot: ".expInfoPanel",
  },
  {
    template: Template.tutorial_step5,
    //spot: ".demo4",
    spot: ".expMainPanel",
  },
    //spot: ".gameNormalForm",
    //spot: ".gameNormalForm tr[data-value='Top']",
    //spot: ".gameNormalForm button[data-value='Top,Right'], .gameNormalForm button[data-value='Bottom,Right']",
    //spot: ".gameNormalForm",
    //spot: ".gameVisualText",
  {
    template: Template.tutorial_step6,
    spot: ".gameNormalForm",
  },
  {
    template: Template.tutorial_step7,
    spot: ".gameNormalForm .cTop",
    //spot: ".expQuestion, .gameNormalForm, .gameNormalFormGame, .gameVisualText, .expChoice, .gameNormalFormPayoff, .gamePlayerTop, .gamePlayerOther",
  },
  {
    template: Template.tutorial_step8,
    spot: ".gameNormalForm .cBottom",
  },
  {
    template: Template.tutorial_step9,
    spot: ".gameNormalForm .cLeft",
  },
  {
    template: Template.tutorial_step10,
    spot: ".gameNormalForm .cRight",
  },
  {
    template: Template.tutorial_step11,
    spot: ".gameNormalForm .cBottomLeft, .gameNormalForm .cBottomRight, .gameNormalForm .cTopRight, .gameNormalForm .cTopLeft",
  },
  {
    template: Template.tutorial_step12,
    spot: ".gameNormalForm .cBottomRight",
  },
  {
    template: Template.tutorial_step13,
    spot: ".gameNormalForm .cBottomLeft",
  },
  {
    template: Template.tutorial_step14,
    spot: ".gameNormalForm",
  },
  {
    template: Template.tutorial_step15,
  },
  {
    template: Template.tutorial_step16,
  },
];

Template.main.helpers({
    options: {
        id: "myCoolTutorial",
        steps: tutorialSteps1,
        emitter: new EventEmitter(),
        onFinish: function() {
            //console.log("Finish first section" );
            //let stage = 3;
            //Router.go('start', { stage : stage });
            //Meteor.setTimeout( function () {
                //// Test debouncing
                //Session.set('tutorialEnabled', true);
            //});
            console.log("Finish clicked!");
            Meteor.setTimeout( function () {
                // Test debouncing
                Session.set('tutorialEnabled', false);
                Router.go('start', { stage : 3 });
            }, 700);
        },
    },
});
//let maxBullets = 5;
Template.tutorialBullets.helpers({
    bullets : function( tutorialSection ) {
        let maxBullets, sectionId;
        maxBullets = 16;
        sectionId =  "_tutorial_step_myCoolTutorial";

        let rvals = _.map( 
                _.range(maxBullets), 
                function( x ) {
                    if ( x === _.toInteger( Session.get(sectionId ) ) ) {
                        return( 'active' );
                    } else {
                        return( '' );
                    }
                }
        );
        return( rvals );
    },
});
Template.registerHelper('tutorialEnabled', function(v1) {
    let design = Sess.design();
        return !_.isNil( design ) && design.tutorialEnabled && Session.get('tutorialEnabled');
});

Template.tutorial_step1.helpers({
    design : function() { return( Sess.design() ); }, 
});
Template.tutorial_step2.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step3.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step4.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step5.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step6.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step7.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step8.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step9.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step10.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step11.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step12.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step13.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step14.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step15.inheritsHelpersFrom('tutorial_step1');
Template.tutorial_step16.inheritsHelpersFrom('tutorial_step1');
