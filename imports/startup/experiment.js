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
    section: 'quiz',
	text: '1) You should press B',
	answer: ["B"],
    choice: null,
	correct: false,
	answered: false,
	submitted: false,
	disabled: false,
	hasError: false,
};
questions[1] = {
    section: 'quiz',
	text: '2) You should press A',
	answer: ["A"],
    choice: null,
	correct: false,
	answered: false,
	submitted: false,
	disabled: false,
	hasError: false,
};
questions[2] = {
    section: 'survey',
	text: 'What is your sex?',
    choice: null,
	answered: false,
	submitted: false,
	disabled: false,
	hasError: false,
};
questions[3] = {
    section: 'survey',
	text: 'Where are you from?',
    choice: null,
	answered: false,
	submitted: false,
	disabled: false,
	hasError: false,
};
questions[4] = {
    section: 'experiment',
    round: 0,
	text: 'Which queue do you choose?',
    choice: null,
	answered: false,
	submitted: false,
	disabled: false,
	hasError: false,
};
questions[5] = {
    section: 'experiment',
    round: 1,
	text: 'Which queue do you choose now?',
    choice: null,
	answered: false,
	submitted: false,
	disabled: false,
	hasError: false,
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


let idxs = _.shuffle( _.range( questions.length ) );
for(var q of idxs){
    Questions.insert(questions[q]);
}

