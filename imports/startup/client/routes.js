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
					currentRound : DesignSequence[ sub.sec_now ].rounds[ sub.sec_rnd_now.toString() ], // BJM using the round labels as a header in the training sections, like Practice 1, Feedback, Practice 2, Feedback, etc.
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
    //} else if (stage === 4) {
        //this.render('repeatUser', { to : 'instructions'});
    //} else if (stage === 3 || stage > 4) {
    } else if (stage === 3 || stage > 3) {
        //this.render('quiz', { to : 'instructions'});
        this.render('repeatUser', { to : 'instructions'});
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

// BJM
Router.route('/training', function() {
    this.render( 'trainingSectionTabPane' );
	
	this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
	
	// BJM I copied this routing logic from the experiment route below
	let data = Router.options.data();
	if (data && data.subStat) {
        let rnd = data.subStat.sec_rnd_now;
		let sec = data.subStat.sec_now;
        
		if (sec == "training") {
			if (rnd % 2 === 0) { // BJM YELLOWALERT, assumes alternating Q/Feedback even/odd round numbers
				this.render( 'instPrefTrain0', { to : 'instPrefTrain' } );
			} else if (rnd % 2 === 1) {
				this.render( 'instPrefTrain1', { to : 'instPrefTrain' } );
			}
		}
		
		// note: "posttraining" section is part of '/experiment' route

    }
}, {
    layoutTemplate: 'main',
    
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
	/* BJM REDALERT, this is the experiment route's data function, I don't understand if more 'enrichment of the global data object' is needed vs what I'm using above
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
    },*/
	path: '/practice',
	waitOn : function () {
        return([
            Meteor.subscribe('s_status'),
            Meteor.subscribe('questions'),
			Meteor.subscribe('s_data'), // BJM REDALERT I don't entirely understand the function of these, I think they're just a one-way connection from server ==> local, and training doesn't require the subject's data for local client use, but I've been using for browser console inspection
			//Meteor.subscribe('designs'), // BJM I had enabled for browser console inspection
        ]);
    },
});
// BJM

Router.route('/experiment', function() {
    // main template
    this.render( 'expSectionTabPane' );

    // infobox template contingent on section
    let data = Router.options.data();
    if (data && (data.currentSection.id === 'survey')) {
		
        this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
		
    }

	// BJM similar to section "survey", the "posttraining" section is of type "experiment" but we're reusing the 'training' template (via logic in this route's 'expSectionTabPane' template in main.html)
	else if (data && (data.currentSection.id === "posttraining")) {
			
			this.render( 'expGeneralInfoBox', { to : 'infoBox' } );
			
			let rnd = data.subStat.sec_rnd_now;
			
			if (rnd % 2 === 0) { // BJM YELLOWALERT, assumes alternating Q/Feedback even/odd round numbers
				this.render( 'instPrefTrain0', { to : 'instPrefTrain' } );
			} else if (rnd % 2 === 1) {
				this.render( 'instPrefTrain1', { to : 'instPrefTrain' } );
			}
	}
	
	else if (data && (data.currentSection.id === 'earningsReport')) {
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
