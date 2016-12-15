/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';

// model
export let Questions = new Mongo.Collection( null );
//export let Questions = new Mongo.Collection( "questions" );
let questions = [];
let groupSize = 4;
let potSize = groupSize*40;

questions[0] = {
    sec: 'quiz',
    sec_rnd: 0,
	text: '1) You should press B',
    type: 'binary',
	correctAnswer: ["B"],
    choice: null,
	correct: false,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[1] = {
    sec: 'quiz',
    sec_rnd: 0,
	text: '2) You should press A',
    type: 'binary',
	correctAnswer: ["A"],
    choice: null,
	correct: false,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[2] = {
    sec: 'survey',
    sec_rnd: 0,
	text: 'What is your sex?',
    type: 'binary',
    choice: null,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[3] = {
    sec: 'survey',
    sec_rnd: 0,
	text: 'Where are you from?',
    type: 'binary',
    choice: null,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[4] = {
    sec: 'experiment1',
    sec_rnd: 0,
	text: 'Which queue do you choose?',
    type: 'binary',
    choice: null,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[5] = {
    sec: 'experiment1',
    sec_rnd: 1,
	text: 'Which queue do you choose now?',
    type: 'binary',
    choice: null,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[6] = {
    sec: 'experiment2',
    sec_rnd: 0,
	text: 'part two: Which queue do you choose?',
    type: 'binary',
    choice: null,
	answered: false,
	disabled: false,
	hasError: false,
};
questions[7] = {
    sec: 'experiment2',
    sec_rnd: 1,
	text: 'part two: Which queue do you choose now?',
    type: 'binary',
    choice: null,
	answered: false,
	disabled: false,
	hasError: false,
};
/*
questions[2] = {
	text: '3) If there are ' + groupSize + ' players, and each player contributes 50 points, what is the total in the group account after the multiplier (1.5x) is applied? (enter a number)',
	correctAnswer: [String(50*groupSize*1.5)],
	correct: false,
	answered: false
};

questions[3] = {
	text: '4) How many other players will you be communicating with during the game?',
	correctAnswer: ['one','1'],
	correct: false,
	answered: false
};
questions[4] = {
	text: '5) How many messages will you be able to send and receive during communication?',
	correctAnswer: ['two','2'],
	correct: false,
	answered: false
};
*/


let idxs = _.shuffle( _.range( questions.length ) );
for(var q of idxs){
    Questions.insert(questions[q]);
}

