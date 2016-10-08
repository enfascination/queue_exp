/*jshint esversion: 6 */

import { Meteor } from 'meteor/meteor';
import { Batches, TurkServer } from 'meteor/mizzao:turkserver';

// I intended this to be client side
/// this isn't reactive at the object level because i want atlleast one variable to be  nonreactive 
let Design = {};

    TurkServer.initialize(function() {
        // initialize click objects
        let clickObjA = Queues.findOne({ queueId: 'A'});
        let clickObjB = Queues.findOne({ queueId: 'B'});
        if (!clickObjA) {
            clickObjA = {count: 0, queueId: 'A'};
            Queues.insert(clickObjA);
        }
        if (!clickObjB) {
            clickObjB = {count: 0, queueId: 'B'};
            Queues.insert(clickObjB);
        }
        console.log("ASDFASDFAS" + clickObjA.count);
        Design.queuePositionStatic = clickObjA.count + clickObjB.count;
        // initialize subject
        //Meteor.call("initializeSubject", clickObjA.count + clickObjB.count);
    });

