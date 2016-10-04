/*jshint esversion: 6 */

import { TurkServer } from 'meteor/mizzao:turkserver';
    

Clicks = new Mongo.Collection('clicks');
TurkServer.partitionCollection(Clicks);

