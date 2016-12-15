/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';

// model
export let Questions = new Mongo.Collection( null );
//export let Questions = new Mongo.Collection( "questions" );

let questions = [
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'binary',
	text: '1) You should press B',
	correctAnswer: ["B"],
	correct: false,
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'binary',
	text: '2) You should press A',
	correctAnswer: ["A"],
	correct: false,
},
{
    sec: 'experiment1',
    sec_rnd: 0,
    type: 'binary',
	text: 'Which queue do you choose?',
},
{
    sec: 'experiment1',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question One',
	text: 'Select a choice, either Top or Bottom',
},
{
    sec: 'experiment1',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question Two',
	text: 'Hypothetically, if you had control over both your choice and the other player\'s, which of the four outcomes would you prefer?',
},
{
    sec: 'experiment1',
    sec_rnd: 1,
    type: 'binary',
	text: 'Which queue do you choose now?',
},
{
    sec: 'experiment2',
    sec_rnd: 0,
    type: 'binary',
	text: 'part two: Which queue do you choose?',
},
{
    sec: 'experiment2',
    sec_rnd: 1,
    type: 'binary',
	text: 'part two: Which queue do you choose now?',
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'binary',
	text: 'What is your sex?',
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'binary',
	text: 'Where are you from?',
},
];
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


//let idxs = _.shuffle( _.range( questions.length ) );
let idxs = _.range( questions.length );
for(var q of idxs){
    questions[q] = _.assign( questions[q], {
        choice: null,
        answered: false,
        disabled: false,
        hasError: false,
        order : q,
    });
    Questions.insert(questions[q]);
}

