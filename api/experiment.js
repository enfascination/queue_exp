/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';

// model
export let Questions = new Mongo.Collection( null );
let questions = [];
let groupSize = 4;
let potSize = groupSize*40;

questions[0] = {
    section: 'quiz',
	text: '1) You should press B',
	answer: ["B"],
	correct: false,
	answered: false,
	submitted: false,
};
questions[1] = {
    section: 'quiz',
	text: '2) You should press A',
	answer: ["A"],
	correct: false,
	answered: false,
	submitted: false,
};
questions[2] = {
    section: 'survey',
	text: 'What is your sex?',
	answered: false,
	submitted: false,
};
questions[3] = {
    section: 'survey',
	text: 'Where are you from?',
	answered: false,
	submitted: false,
};
questions[4] = {
    section: 'experiment',
	text: 'Which queue do you choose?',
	answered: false,
	submitted: false,
};
/*
questions[2] = {
	text: '3) If there are ' + groupSize + ' players, and each player contributes 50 points, what is the total in the group account after the multiplier (1.5x) is applied? (enter a number)',
	answer: [String(50*groupSize*1.5)],
	correct: false,
	answered: false
};

questions[3] = {
	text: '4) How many other players will you be communicating with during the game?',
	answer: ['one','1'],
	correct: false,
	answered: false
};
questions[4] = {
	text: '5) How many messages will you be able to send and receive during communication?',
	answer: ['two','2'],
	correct: false,
	answered: false
};
*/


let idxs = _.shuffle([0,1,2,3,4]);
for(var q of idxs){
    Questions.insert(questions[q]);
}

