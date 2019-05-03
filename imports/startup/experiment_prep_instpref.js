/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';

export let QuestionData = {};

// BJM we can't access Design from this file (I believe due to Meteor file load order), so this setting is stored here, used below, and exported for inclusions in Design in api/design/models.js
export let trainingQuestionsRandomSettings = {
	randomizePageOrder: true, // a 'page' of training/Practice questions is the group of questions assigned to round x, so this randomizes the order of pages of questions
	// REMOVED randomizeOrderWithinPages: false, // randomize the order of individual questions on a 'page', Seth explained this isn't needed as we assume subject can read in whatever order
}

console.log("Design.tutorialEnabled");

// http://www.textfixer.com/resources/dropdowns/country-list-iso-codes.txt
let countryCodes = [ 'XX:Decline to state', 'US:United States', 'AF:Afghanistan', 'AX:Åland Islands', 'AL:Albania', 'DZ:Algeria', 'AS:American Samoa', 'AD:Andorra', 'AO:Angola', 'AI:Anguilla', 'AQ:Antarctica', 'AG:Antigua and Barbuda', 'AR:Argentina', 'AM:Armenia', 'AW:Aruba', 'AU:Australia', 'AT:Austria', 'AZ:Azerbaijan', 'BS:Bahamas', 'BH:Bahrain', 'BD:Bangladesh', 'BB:Barbados', 'BY:Belarus', 'BE:Belgium', 'BZ:Belize', 'BJ:Benin', 'BM:Bermuda', 'BT:Bhutan', 'BO:Bolivia', 'BA:Bosnia and Herzegovina', 'BW:Botswana', 'BV:Bouvet Island', 'BR:Brazil', 'IO:British Indian Ocean Territory', 'BN:Brunei Darussalam', 'BG:Bulgaria', 'BF:Burkina Faso', 'BI:Burundi', 'KH:Cambodia', 'CM:Cameroon', 'CA:Canada', 'CV:Cape Verde', 'KY:Cayman Islands', 'CF:Central African Republic', 'TD:Chad', 'CL:Chile', 'CN:China', 'CX:Christmas Island', 'CC:Cocos (Keeling) Islands', 'CO:Colombia', 'KM:Comoros', 'CG:Congo', 'CD:Congo, The Democratic Republic of The', 'CK:Cook Islands', 'CR:Costa Rica', 'CI:Cote D\'ivoire', 'HR:Croatia', 'CU:Cuba', 'CY:Cyprus', 'CZ:Czech Republic', 'DK:Denmark', 'DJ:Djibouti', 'DM:Dominica', 'DO:Dominican Republic', 'EC:Ecuador', 'EG:Egypt', 'SV:El Salvador', 'GQ:Equatorial Guinea', 'ER:Eritrea', 'EE:Estonia', 'ET:Ethiopia', 'FK:Falkland Islands (Malvinas)', 'FO:Faroe Islands', 'FJ:Fiji', 'FI:Finland', 'FR:France', 'GF:French Guiana', 'PF:French Polynesia', 'TF:French Southern Territories', 'GA:Gabon', 'GM:Gambia', 'GE:Georgia', 'DE:Germany', 'GH:Ghana', 'GI:Gibraltar', 'GR:Greece', 'GL:Greenland', 'GD:Grenada', 'GP:Guadeloupe', 'GU:Guam', 'GT:Guatemala', 'GG:Guernsey', 'GN:Guinea', 'GW:Guinea-bissau', 'GY:Guyana', 'HT:Haiti', 'HM:Heard Island and Mcdonald Islands', 'VA:Holy See (Vatican City State)', 'HN:Honduras', 'HK:Hong Kong', 'HU:Hungary', 'IS:Iceland', 'IN:India', 'ID:Indonesia', 'IR:Iran, Islamic Republic of', 'IQ:Iraq', 'IE:Ireland', 'IM:Isle of Man', 'IL:Israel', 'IT:Italy', 'JM:Jamaica', 'JP:Japan', 'JE:Jersey', 'JO:Jordan', 'KZ:Kazakhstan', 'KE:Kenya', 'KI:Kiribati', 'KP:Korea, Democratic People\'s Republic of', 'KR:Korea, Republic of', 'KW:Kuwait', 'KG:Kyrgyzstan', 'LA:Lao People\'s Democratic Republic', 'LV:Latvia', 'LB:Lebanon', 'LS:Lesotho', 'LR:Liberia', 'LY:Libyan Arab Jamahiriya', 'LI:Liechtenstein', 'LT:Lithuania', 'LU:Luxembourg', 'MO:Macao', 'MK:Macedonia, The Former Yugoslav Republic of', 'MG:Madagascar', 'MW:Malawi', 'MY:Malaysia', 'MV:Maldives', 'ML:Mali', 'MT:Malta', 'MH:Marshall Islands', 'MQ:Martinique', 'MR:Mauritania', 'MU:Mauritius', 'YT:Mayotte', 'MX:Mexico', 'FM:Micronesia, Federated States of', 'MD:Moldova, Republic of', 'MC:Monaco', 'MN:Mongolia', 'ME:Montenegro', 'MS:Montserrat', 'MA:Morocco', 'MZ:Mozambique', 'MM:Myanmar', 'NA:Namibia', 'NR:Nauru', 'NP:Nepal', 'NL:Netherlands', 'AN:Netherlands Antilles', 'NC:New Caledonia', 'NZ:New Zealand', 'NI:Nicaragua', 'NE:Niger', 'NG:Nigeria', 'NU:Niue', 'NF:Norfolk Island', 'MP:Northern Mariana Islands', 'NO:Norway', 'OM:Oman', 'PK:Pakistan', 'PW:Palau', 'PS:Palestinian Territory, Occupied', 'PA:Panama', 'PG:Papua New Guinea', 'PY:Paraguay', 'PE:Peru', 'PH:Philippines', 'PN:Pitcairn', 'PL:Poland', 'PT:Portugal', 'PR:Puerto Rico', 'QA:Qatar', 'RE:Reunion', 'RO:Romania', 'RU:Russian Federation', 'RW:Rwanda', 'SH:Saint Helena', 'KN:Saint Kitts and Nevis', 'LC:Saint Lucia', 'PM:Saint Pierre and Miquelon', 'VC:Saint Vincent and The Grenadines', 'WS:Samoa', 'SM:San Marino', 'ST:Sao Tome and Principe', 'SA:Saudi Arabia', 'SN:Senegal', 'RS:Serbia', 'SC:Seychelles', 'SL:Sierra Leone', 'SG:Singapore', 'SK:Slovakia', 'SI:Slovenia', 'SB:Solomon Islands', 'SO:Somalia', 'ZA:South Africa', 'GS:South Georgia and The South Sandwich Islands', 'ES:Spain', 'LK:Sri Lanka', 'SD:Sudan', 'SR:Suriname', 'SJ:Svalbard and Jan Mayen', 'SZ:Swaziland', 'SE:Sweden', 'CH:Switzerland', 'SY:Syrian Arab Republic', 'TW:Taiwan, Province of China', 'TJ:Tajikistan', 'TZ:Tanzania, United Republic of', 'TH:Thailand', 'TL:Timor-leste', 'TG:Togo', 'TK:Tokelau', 'TO:Tonga', 'TT:Trinidad and Tobago', 'TN:Tunisia', 'TR:Turkey', 'TM:Turkmenistan', 'TC:Turks and Caicos Islands', 'TV:Tuvalu', 'UG:Uganda', 'UA:Ukraine', 'AE:United Arab Emirates', 'GB:United Kingdom', 'US:United States', 'UM:United States Minor Outlying Islands', 'UY:Uruguay', 'UZ:Uzbekistan', 'VU:Vanuatu', 'VE:Venezuela', 'VN:Viet Nam', 'VG:Virgin Islands, British', 'VI:Virgin Islands, U.S.', 'WF:Wallis and Futuna', 'EH:Western Sahara', 'YE:Yemen', 'ZM:Zambia', 'ZW:Zimbabwe', 'ZZ:Unknown or unspecified country', ];

// BJM Training Question Payoffs; a 'page' of training/Practice questions is the group of questions assigned to round x
var trainingQuestionPayoffs = {
	page_one: [2,1,2,3,4,2,0,1],
	page_two: [3,3,2,4,1,1,0,1],
	page_three: [0,2,1,2,0,3,1,3],
	page_four: [0,3,1,3,2,1,3,4],
};

QuestionData.questions = [
/*{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'quad',
	text: 'What is the greatest number of points you can earn?',
    options: ["1", "2", "3", "4"],
	correctAnswer: ["4"],
},*/
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 1',
	text: 'If you knew in advance that the other player was going to select <strong>Right</strong>, which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either <strong>Top</strong> or <strong>Bottom</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 2',
	text: 'If you knew in advance that the other player was going to select <strong>Left</strong>, which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either <strong>Top</strong> or <strong>Bottom</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 3',
	text: 'If the other player knew in advance that you were going to select <strong>Top</strong>, which of their two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 4',
	text: 'If the other player knew in advance that you were going to select <strong>Bottom</strong>, which of their two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 5',
	text: 'Which outcome confers the greatest number of points to you?',
	label: 'Select one of the four game outcomes.',
    options: ["Top,Left", "Top,Right", "Bottom,Left", "Bottom,Right"],
	correctAnswer: ["Bottom,Left"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 6',
	text: 'Which outcome confers the greatest number of points to the other player?',
	label: 'Select one of the four game outcomes.',
    options: ["Top,Left", "Top,Right", "Bottom,Left", "Bottom,Right"],
	correctAnswer: ["Top,Right"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 7',
	text: 'Which outcome confers the greatest number of points to both players, considered together?',
	label: 'Select one of the four game outcomes.',
    options: ["Top,Left", "Top,Right", "Bottom,Left", "Bottom,Right"],
	correctAnswer: ["Top,Left"],
},
{ // BJM START pre-Experiment training questions
    sec: 'training',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 1',
	text: 'If you knew in advance that the other player was going to select Right, which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'if you knew the other player was going to select Right, you would earn the most points choosing Bottom for the Bottom,Right outcome.',
	payoffs: trainingQuestionPayoffs.page_one,
}, 
{
    sec: 'training',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 2',
	text: 'Which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'you would earn more points by choosing Bottom, whether the other player picked Left or Right.',
	payoffs: trainingQuestionPayoffs.page_one,
},
{
    sec: 'training',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 3',
	text: 'Which of your two choices would you pick if you want to earn at least 2 points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'to earn at least 2 points more than the other player only the choice Bottom can result in the outcome Bottom,Right for at least 2 points.',
	payoffs: trainingQuestionPayoffs.page_one,
},
{
    sec: 'training',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 4',
	text: 'If you were motivated to earn as many points as possible more than the other player, which strategy should you choose?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'you will only earn more points than the other player if they choose Right, so you would choose Bottom to earn a maximum of 2 points more than the other player, for the possible final outcome of Bottom,Right.',
	payoffs: trainingQuestionPayoffs.page_one,
},
{
    sec: 'training',
    sec_rnd: 2,
    type: 'chooseStrategyTop',
	title: 'Question 1',
	text: 'If the other player knew in advance that you were going to select Top, which of their two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Left"],
	trainingFeedback: 'if the other player knew you were going to select Top, they would earn the most points choosing Left for the Top,Left outcome.',
	payoffs: trainingQuestionPayoffs.page_two,
}, 
{
    sec: 'training',
    sec_rnd: 2,
    type: 'chooseStrategyTop',
	title: 'Question 2',
	text: 'Which of the other player’s two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Left"],
	trainingFeedback: 'the other player would earn the most points by choosing Left, whether you picked Top or Bottom.',
	payoffs: trainingQuestionPayoffs.page_two,
},
{
    sec: 'training',
    sec_rnd: 2,
    type: 'chooseStrategyTop',
	title: 'Question 3',
	text: 'Which of the other player’s two choices would they pick if they want to earn at least 1 point?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Left"],
	trainingFeedback: 'the other player would earn at least 1 point by choosing Left, whether you picked Top or Bottom.',
	payoffs: trainingQuestionPayoffs.page_two,
},
{
    sec: 'training',
    sec_rnd: 2,
    type: 'chooseStrategyTop',
	title: 'Question 4',
	text: 'If the other player wants you to earn the least number of points more than they will earn, which strategy should they choose?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Left"],
	trainingFeedback: 'if the other player picked Left you would earn at most 2 points more than them, whether you picked Top or Bottom.',
	payoffs: trainingQuestionPayoffs.page_two,
},
{
    sec: 'training',
    sec_rnd: 4,
    type: 'chooseStrategy',
	title: 'Question 1',
	text: 'If you knew in advance that the other player was going to select Left, which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'if you knew the other player was going to select Left, you would earn the most points choosing Bottom for the Bottom,Left outcome.',
	payoffs: trainingQuestionPayoffs.page_three,
}, 
{
    sec: 'training',
    sec_rnd: 4,
    type: 'chooseStrategy',
	title: 'Question 2',
	text: 'Which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'you would earn the most points by choosing Bottom, whether the other player picked Left or Right.',
	payoffs: trainingQuestionPayoffs.page_three,
},
{
    sec: 'training',
    sec_rnd: 4,
    type: 'chooseStrategy',
	title: 'Question 3',
	text: 'Which of your two choices would you pick if you want to earn at least 1 point?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
	trainingFeedback: 'you would earn at least 1 point by choosing Bottom, whether the other player picked Left or Right.',
	payoffs: trainingQuestionPayoffs.page_three,
},
{
    sec: 'training',
    sec_rnd: 4,
    type: 'chooseStrategy',
	title: 'Question 4',
	text: 'If you are are motivated to earn as many points as possible more than the other player, which strategy should you choose?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Top"],
	trainingFeedback: 'you would earn more points than the other player only if you chose Top and the outcome were Top,Right.',
	payoffs: trainingQuestionPayoffs.page_three,
},
// BJM END training questions
/*{
    sec: 'experiment',
    sec_rnd: 0,
    type: 'binary',
	text: 'Which queue do you choose?',
},*/
{
    sec: 'experiment',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 1.1',
	text: 'You are playing this game with another player.  They can choose <strong>Left</strong> or <strong>Right</strong>.',
	label: 'Make your choice for this game, either <strong>Top</strong> or <strong>Bottom</strong>.',
    strategic: true,
    paid: true,
},
{
    sec: 'experiment',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 1.2',
	text: 'Hypothetically, if you had control over both your choice and the other player\'s, and were to decide how much each of you earn in this game, which of the four outcomes would you select?',
	label: 'Select one of the four game outcomes.',
},
{
    sec: 'experiment',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 1.3',
	text: 'What choice do you think the other player is going to make?',
	label: 'Select either <strong>Left</strong> or <strong>Right</strong>.',
},
{
    sec: 'experiment',
    sec_rnd: 1,
    type: 'chooseStrategy',
	title: 'Question 2.1',
	text: 'You are now playing a slightly different game with the same player.  They can choose <strong>Left</strong> or <strong>Right</strong>.',
	label: 'Make your choice for this game, either <strong>Top</strong> or <strong>Bottom</strong>.',
    strategic: true,
    paid: true,
},
{
    sec: 'experiment',
    sec_rnd: 1,
    type: 'chooseOutcome',
	title: 'Question 2.2',
	text: 'Hypothetically, if you had control over both your choice and the other player\'s, and were to decide how much each of you earn in this game, which of the four outcomes would you select?',
	label: 'Select one of the game outcomes.',
},
{
    sec: 'experiment',
    sec_rnd: 1,
    type: 'chooseStrategyTop',
	title: 'Question 2.3',
	text: 'What choice do you think the other player is going to make?',
	label: 'Select either <strong>Left</strong> or <strong>Right</strong>.',
},
{
    sec: 'experiment',
    sec_rnd: 3,
    type: 'chooseGame',
	title: 'Question',
	text: 'Which game would you prefer to play again?',
	label: 'Select one of the games below.',
},
{
    sec: 'experiment',
    sec_rnd: 4,
    type: 'chooseStrategy',
	title: 'Question',
	text: 'You are playing this game with the other player.',
	label: 'Make your choice for this game, either Top or Bottom.',
    strategic: true,
    paid: true,
},
//BJM START default post-Experiment "posttraining" section questions, ('default' before any randomization)
{
    sec: 'posttraining',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 1',
	text: 'If the other player knew in advance that you were going to select Bottom, which of their two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
	trainingFeedback: 'if the other player knew you were going to select Top, they would earn the most points choosing Right for the Top,Right outcome.',
	payoffs: trainingQuestionPayoffs.page_four,
}, 
{
    sec: 'posttraining',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 2',
	text: 'Which of the other player’s two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
	trainingFeedback: 'the other player will earn the most points by choosing Right, whether you pick Top or Bottom.',
	payoffs: trainingQuestionPayoffs.page_four,
},
{
    sec: 'posttraining',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 3',
	text: 'Which of the other player’s two choices would they pick if they want to earn at least 2 points?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
	trainingFeedback: 'they will earn at least 2 points by choosing Right, whether you pick Top or Bottom.',
	payoffs: trainingQuestionPayoffs.page_four,
},
{
    sec: 'posttraining',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 4',
	text: 'If the other player is motivated to earn at least two points more than you, which strategy should they choose?',
	label: 'Make the other player\'s choice for this game, either <strong>Left</strong> or <strong>Right</strong>.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Left"],
	trainingFeedback: 'they will only earn 2 points more than you if the game outcome is Top,Left which can only happen if they choose Left.',
	payoffs: trainingQuestionPayoffs.page_four,
},
//BJM END post-Experiment training questions
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What country are you from?',
    options: countryCodes,
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'text',
	label: 'Enter your postal code. If you are in the USA, enter your 5-digit zip code.',
    pattern: "([0-9]+)|(xxxxxx)",
    fieldName: "Postal code",
},// regex: ^(?:\d{5})?$
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What is your sex?',
    options: ['Female','Male','Other','Decline to state'],
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'text',
	label: 'What is your age?',
    pattern: "([1]?[0-9]{1,2})|(xxxxxx)",
    fieldName: "Your age",
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What is the highest level of education you have completed?',
    options:[
        "Primary school only (or less)]",
        "Secondary school",
        "Intermediate between secondary level and university (e.g. technical training)",
        "University or college or equivalent",
        "Postgraduate degree (Masters or Ph.D.)",
        "Decline to state",
    ],
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What is the number of people in your household?',
    options: _(1).range(7).map(_.toString).concat( '7+', 'Decline to state').value(),
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'Would you like to be notified about future experiments from our lab?',
    options:[
        "Yes",
        "No",
        "Decline to state",
    ],
    default: 0,
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

// test experiment flow with zero questions
//    make sure it still goes through the whole thing



if ( false ) {
    QuestionData.questions = [
        {
            sec: 'experiment',
            sec_rnd: 0,
            type: 'chooseStrategy',
            title: 'Question 1.1',
            text: 'You are playing the game below with another person.  They are choosing Left or Right.  You will choose either Top or Bottom.',
            label: 'Make your choice for this game, either Top or Bottom.',
            strategic: true,
            paid: true,
        },
    ];
}

/////////////////////////////////////////////
// BJM START Training Question maintenance and randomization
/////////////////////////////////////////////


// // // -- // // // -- // // //
//
//  first, set our isATrainingQuestion flag

QuestionData.questions.forEach ( function(q) {
    
	//initialize isATrainingQuestion for all questions
	_.assign( q, {
        isATrainingQuestion: false,
    });
	
	//for 'training' section, set isATrainingQuestion, assign unique id (using default order)
	if( q.sec === 'training' || q.sec === 'posttraining'){
		_.assign( q, {
			isATrainingQuestion: true,
			// BJM REDALERT -- for convenience, I'm setting question unique ID en masse using order
			// however this will break ID between app instances if Qs are added/removed
			// other option is to make the QID a unique string and use that instead and
			// set manually in question objects vs dynamically here.
			trainingQuestionId : _.indexOf(QuestionData.questions, q),
		});
	}
});


// // // -- // // // -- // // //
//
// Now we randomize training questions; randomizeTrainingQuestions() returns an array of randomized training questions, function below.
let trainingQuestionsRandomized = randomizeTrainingQuestions();

// // // -- // // // -- // // //
//
// Now we update our QuestionData.questions with the new trainingQuestionsRandomized

//remove the old default questions
_.remove(QuestionData.questions, function(q) { return (q.sec === 'training' || q.sec === 'posttraining') }); // unlike filter, _.remove mutates QuestionData.questions

//add the randomized training questions
QuestionData.questions = _.concat(QuestionData.questions, trainingQuestionsRandomized);

/////////////////////////////////////////////
// BJM END Training Question maintenance and randomization
/////////////////////////////////////////////

//let idxs = _.shuffle( _.range( questions.length ) );
//  Create multiple sections
let questionsAddendum = [];
QuestionData.questions.forEach ( function(q) {
    if( q.sec === 'experiment' ) {
        q.sec = 'experiment2';
        questionsAddendum = _.concat(questionsAddendum, _.clone(q) );
        q.sec = 'experiment1';
    }
});

QuestionData.questions = _.concat(QuestionData.questions, questionsAddendum);

// BJM START Assign 'order' to All Questions; questions are created in the QuestionData.questions array, entered in the order they appear, but we've since removed/_.concat the training questions for randomization, and created/_.concat the "experiment2" section questions; so now we reorder the questions and assign an 'order' field

// https://stackoverflow.com/questions/18859186/sorting-an-array-of-javascript-objects-a-specific-order-using-existing-function
// This approach is not elegant, sectionOrder is hardcoded here; again we can't access Design from this file (I think due to Meteor file load order)
var sectionOrder = ["quiz", "training", "experiment1", "experiment2", "posttraining", "survey"];
QuestionData.questions = _.sortBy(QuestionData.questions, function(q){ 
    return _.indexOf(sectionOrder, q.sec);
}, function(q){ 
    return q.sec_rnd;
}); // Note: we sort by section and sec_rnd, but no further sorting; Questions appear in the order they're entered into the array, and they're assigned this order 

// assign the order
QuestionData.questions.forEach ( function(q) {
    _.assign( q, {
        order : _.indexOf(QuestionData.questions, q),
    });
});

// want to inspect the results?
if ( false ) {
	console.log("Question order output: \n\n order, section, round, title");
	QuestionData.questions.forEach ( function(q) {
		console.log(_.indexOf(QuestionData.questions, q), q.sec, q.sec_rnd, q.title);
	});
}

// BJM END Assign 'order' to All Questions

//  initialize all question objects
QuestionData.questions.forEach ( function(q) {
    _.assign( q, {
        choice: null,
        answered: false,
        disabled: false,
        hasError: false,
        //order : _.indexOf(QuestionData.questions, q), // BJM I moved the order field to the section above for clarity
		
    });
    if( q.sec === 'quiz' ) {
        q.correct = false;
        //q.payoffs = [1,-1,2,0,1,-1,2,0];
        q.payoffs = [2,0,3,1,2,0,3,1];
        //q.payoffs = [3,1,4,2,3,1,4,2];
        q.sec_label = "Quiz";
    } else if( q.sec === 'training' ){ // BJM, patterning after quiz above, except payoffs refactored to appear further up
		
		q.correct = false;
        q.sec_label = "Practice"; // the sec_label field is used in HTML for Experiment questions in the <template name="earningsReport">, it isn't used for Practice Qs as the earningsReport doesn't go into Practice question detail, however retaining pattern
		
	} else if( q.sec === 'experiment' ) {
        console.log("ERROR NMV<KUIOKJHLDF: async mess on q init?");
    } else if( q.sec === 'experiment1' ) {
        q.sec_label = "Section 1";
    } else if( q.sec === 'experiment2' ) {
        q.sec_label = "Section 2";
    } else if( q.sec === 'posttraining' ){
		q.correct = false;
        q.sec_label = "Practice";
	} else if( q.sec === 'survey' ) {
        q.sec_label = "Survey";
    }
    if( q.sec === 'experiment1' || q.sec === 'experiment2' ) {
        if( _.isNil(q.paid) || !q.paid ) { q.paid = false; }
        if( _.isNil(q.strategic) || !q.strategic ) { q.strategic = false; }
    }
    //console.log(q);
    //Meteor.call("addQuestion", questions[q]);
});

function randomizeTrainingQuestions() {
	
	// // // -- // // //
	// get an array of all the training questions
	let trainingQuestions = _.filter(QuestionData.questions, function(q) { return (q.sec === 'training' || q.sec === 'posttraining') });
	
	// // // -- // // //
	// Overview: to randomize page order, we'll take default round sequence from trainingQuestions and map to a shuffled round sequence
	
	// first, we need the default 'posttraining' questions to have a distinct round number (0 is shared for 'training' and 'posttraining'); we'll also set the section to 'training' since this group of questions may be shuffled into the 'training' section
	trainingQuestions.forEach( function( q ) {
			if (q.sec === 'posttraining') {
				_.assign( q, {
				sec: 'training',
				sec_rnd: 999, //arbitrarily distinct number, 
				});
			}
	});
	
	// get the default round sequence
	let defaultQSec_rnds = _.map(trainingQuestions, 'sec_rnd').sort(); // e.g. [0, 0, 0, 0, 2, 2, 2, 4, 4, 4, 999, 999, 999], .sort() just OCD cleaner, in case Qs weren't provided in sequence e.g. [0, 0, 4, 0, 2, 2, 2, 4, 4, etc.] 
	
	let defaultRoundSeq = [...new Set(defaultQSec_rnds)]; // [0, 2, 4, 999], unique values

	//randomize new round sequence 
	if ( trainingQuestionsRandomSettings.randomizePageOrder === true ) {
		var newRoundSeq = _.shuffle(defaultRoundSeq); // e.g. [4, 2, 999, 0]
	} else {
		var newRoundSeq = defaultRoundSeq.slice(); // no page randomization, .slice() for deep copy (likely unnecessary)
	}
	
	//map default seq to new random seq
	let newRoundMapping = _.zip(defaultRoundSeq,newRoundSeq);  // e.g. [[0, 4], [2, 2], [4, 999], [999, 0]]
	
	// // // -- // // //
	// now we build final array of randomized questions
	let trainingQuestionsRandomized = [];

	// for each mapping... e.g. [[0, 4], [2, 2], [4, 0]], isolate and update those questions, <!-- REMOVED randomize within round -->, add to final array
	newRoundMapping.forEach( function( [old_rnd, new_rnd] ) {
		let questionGroup = _.remove(trainingQuestions, {'sec_rnd': old_rnd}); //_.remove mutates trainingQuestions
		
		//randomize question order within round
		/* REMOVED if ( trainingQuestionsRandomSettings.randomizeOrderWithinPages === true ) {
			questionGroup = _.shuffle( questionGroup )
		}*/
		
		//assign new round, and order on page
		questionGroup.forEach( function( q ) {
			//_.set(q, 'sec_rnd', new_rnd);
			_.assign( q, {
			sec_rnd: new_rnd,
			}); 
		});
	
		//add this page of questions to our final array
		trainingQuestionsRandomized = trainingQuestionsRandomized.concat(questionGroup);
	});
	
	// // // -- // // // -- // // //
	//
	// Now we isolate one group of questions to be the post-Experiment "posttraining" section questions
	
	trainingQuestionsRandomized.forEach ( function ( q ) {
		if (q.sec_rnd === 999) { // messy, the arbitrarily distinct number we gave to the post-Experiment training questions above (if randomizePageOrder, this number been randomly assigned to questions)
			_.assign( q, {
			sec: 'posttraining',
			sec_rnd : 0,
			}); //BJM YELLOWALERT hard-coded: setting the post-survey training question to Round 0
		}
	});
	
	// Some debugging inspection
	if ( false ) {
	//console.log(trainingQuestionsRandomized);
	console.log("randomized round mapping:\n",newRoundMapping);
	// show us the old section rounds
	console.log("old section rounds:      \n",defaultQSec_rnds);

	// show us the new section rounds
	let newrnds = _.map(trainingQuestionsRandomized, 'sec_rnd');
	console.log("new section rounds:      \n",newrnds);
	
	//console.log(trainingQuestionsRandomized);
	}
	
	return trainingQuestionsRandomized;
}


