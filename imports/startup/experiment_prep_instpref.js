/*jshint esversion: 6 */

var _ = require('lodash');
import { Meteor } from 'meteor/meteor';

export let QuestionData = {};

// http://www.textfixer.com/resources/dropdowns/country-list-iso-codes.txt
let countryCodes = [ 'US:United States', 'AF:Afghanistan', 'AX:Åland Islands', 'AL:Albania', 'DZ:Algeria', 'AS:American Samoa', 'AD:Andorra', 'AO:Angola', 'AI:Anguilla', 'AQ:Antarctica', 'AG:Antigua and Barbuda', 'AR:Argentina', 'AM:Armenia', 'AW:Aruba', 'AU:Australia', 'AT:Austria', 'AZ:Azerbaijan', 'BS:Bahamas', 'BH:Bahrain', 'BD:Bangladesh', 'BB:Barbados', 'BY:Belarus', 'BE:Belgium', 'BZ:Belize', 'BJ:Benin', 'BM:Bermuda', 'BT:Bhutan', 'BO:Bolivia', 'BA:Bosnia and Herzegovina', 'BW:Botswana', 'BV:Bouvet Island', 'BR:Brazil', 'IO:British Indian Ocean Territory', 'BN:Brunei Darussalam', 'BG:Bulgaria', 'BF:Burkina Faso', 'BI:Burundi', 'KH:Cambodia', 'CM:Cameroon', 'CA:Canada', 'CV:Cape Verde', 'KY:Cayman Islands', 'CF:Central African Republic', 'TD:Chad', 'CL:Chile', 'CN:China', 'CX:Christmas Island', 'CC:Cocos (Keeling) Islands', 'CO:Colombia', 'KM:Comoros', 'CG:Congo', 'CD:Congo, The Democratic Republic of The', 'CK:Cook Islands', 'CR:Costa Rica', 'CI:Cote D\'ivoire', 'HR:Croatia', 'CU:Cuba', 'CY:Cyprus', 'CZ:Czech Republic', 'DK:Denmark', 'DJ:Djibouti', 'DM:Dominica', 'DO:Dominican Republic', 'EC:Ecuador', 'EG:Egypt', 'SV:El Salvador', 'GQ:Equatorial Guinea', 'ER:Eritrea', 'EE:Estonia', 'ET:Ethiopia', 'FK:Falkland Islands (Malvinas)', 'FO:Faroe Islands', 'FJ:Fiji', 'FI:Finland', 'FR:France', 'GF:French Guiana', 'PF:French Polynesia', 'TF:French Southern Territories', 'GA:Gabon', 'GM:Gambia', 'GE:Georgia', 'DE:Germany', 'GH:Ghana', 'GI:Gibraltar', 'GR:Greece', 'GL:Greenland', 'GD:Grenada', 'GP:Guadeloupe', 'GU:Guam', 'GT:Guatemala', 'GG:Guernsey', 'GN:Guinea', 'GW:Guinea-bissau', 'GY:Guyana', 'HT:Haiti', 'HM:Heard Island and Mcdonald Islands', 'VA:Holy See (Vatican City State)', 'HN:Honduras', 'HK:Hong Kong', 'HU:Hungary', 'IS:Iceland', 'IN:India', 'ID:Indonesia', 'IR:Iran, Islamic Republic of', 'IQ:Iraq', 'IE:Ireland', 'IM:Isle of Man', 'IL:Israel', 'IT:Italy', 'JM:Jamaica', 'JP:Japan', 'JE:Jersey', 'JO:Jordan', 'KZ:Kazakhstan', 'KE:Kenya', 'KI:Kiribati', 'KP:Korea, Democratic People\'s Republic of', 'KR:Korea, Republic of', 'KW:Kuwait', 'KG:Kyrgyzstan', 'LA:Lao People\'s Democratic Republic', 'LV:Latvia', 'LB:Lebanon', 'LS:Lesotho', 'LR:Liberia', 'LY:Libyan Arab Jamahiriya', 'LI:Liechtenstein', 'LT:Lithuania', 'LU:Luxembourg', 'MO:Macao', 'MK:Macedonia, The Former Yugoslav Republic of', 'MG:Madagascar', 'MW:Malawi', 'MY:Malaysia', 'MV:Maldives', 'ML:Mali', 'MT:Malta', 'MH:Marshall Islands', 'MQ:Martinique', 'MR:Mauritania', 'MU:Mauritius', 'YT:Mayotte', 'MX:Mexico', 'FM:Micronesia, Federated States of', 'MD:Moldova, Republic of', 'MC:Monaco', 'MN:Mongolia', 'ME:Montenegro', 'MS:Montserrat', 'MA:Morocco', 'MZ:Mozambique', 'MM:Myanmar', 'NA:Namibia', 'NR:Nauru', 'NP:Nepal', 'NL:Netherlands', 'AN:Netherlands Antilles', 'NC:New Caledonia', 'NZ:New Zealand', 'NI:Nicaragua', 'NE:Niger', 'NG:Nigeria', 'NU:Niue', 'NF:Norfolk Island', 'MP:Northern Mariana Islands', 'NO:Norway', 'OM:Oman', 'PK:Pakistan', 'PW:Palau', 'PS:Palestinian Territory, Occupied', 'PA:Panama', 'PG:Papua New Guinea', 'PY:Paraguay', 'PE:Peru', 'PH:Philippines', 'PN:Pitcairn', 'PL:Poland', 'PT:Portugal', 'PR:Puerto Rico', 'QA:Qatar', 'RE:Reunion', 'RO:Romania', 'RU:Russian Federation', 'RW:Rwanda', 'SH:Saint Helena', 'KN:Saint Kitts and Nevis', 'LC:Saint Lucia', 'PM:Saint Pierre and Miquelon', 'VC:Saint Vincent and The Grenadines', 'WS:Samoa', 'SM:San Marino', 'ST:Sao Tome and Principe', 'SA:Saudi Arabia', 'SN:Senegal', 'RS:Serbia', 'SC:Seychelles', 'SL:Sierra Leone', 'SG:Singapore', 'SK:Slovakia', 'SI:Slovenia', 'SB:Solomon Islands', 'SO:Somalia', 'ZA:South Africa', 'GS:South Georgia and The South Sandwich Islands', 'ES:Spain', 'LK:Sri Lanka', 'SD:Sudan', 'SR:Suriname', 'SJ:Svalbard and Jan Mayen', 'SZ:Swaziland', 'SE:Sweden', 'CH:Switzerland', 'SY:Syrian Arab Republic', 'TW:Taiwan, Province of China', 'TJ:Tajikistan', 'TZ:Tanzania, United Republic of', 'TH:Thailand', 'TL:Timor-leste', 'TG:Togo', 'TK:Tokelau', 'TO:Tonga', 'TT:Trinidad and Tobago', 'TN:Tunisia', 'TR:Turkey', 'TM:Turkmenistan', 'TC:Turks and Caicos Islands', 'TV:Tuvalu', 'UG:Uganda', 'UA:Ukraine', 'AE:United Arab Emirates', 'GB:United Kingdom', 'UM:United States Minor Outlying Islands', 'UY:Uruguay', 'UZ:Uzbekistan', 'VU:Vanuatu', 'VE:Venezuela', 'VN:Viet Nam', 'VG:Virgin Islands, British', 'VI:Virgin Islands, U.S.', 'WF:Wallis and Futuna', 'EH:Western Sahara', 'YE:Yemen', 'ZM:Zambia', 'ZW:Zimbabwe', 'ZZ:Unknown or unspecified country', 'XX:Decline to state', ];

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
	text: 'If you knew in advance that the other player was going to select Right, which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategy',
	title: 'Question 2',
	text: 'If you knew in advance that the other player was going to select Left, which of your two choices would you pick to earn the most points?',
	label: 'Make your choice for this game, either Top or Bottom.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Bottom"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 3',
	text: 'If the other player knew in advance that you were going to select Top, which of their two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either Left or Right.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseStrategyTop',
	title: 'Question 4',
	text: 'If the other player knew in advance that you were going to select Bottom, which of their two choices would they pick to earn the most points?',
	label: 'Make the other player\'s choice for this game, either Left or Right.',
    options: ["Left", "Right", "Top", "Bottom"],
	correctAnswer: ["Right"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 5',
	text: 'Which outcome confers the greatest number of points to the other player?',
	label: 'Select one of the four game outcomes.',
    options: ["Top,Left", "Top,Right", "Bottom,Left", "Bottom,Right"],
	correctAnswer: ["Top,Right"],
},
{
    sec: 'quiz',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 6',
	text: 'Which outcome confers the greatest number of points to both players, in total?',
	label: 'Select one of the four game outcomes.',
    options: ["Top,Left", "Top,Right", "Bottom,Left", "Bottom,Right"],
	correctAnswer: ["Top,Left"],
},
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
	text: 'You are playing the game below with another person.  They are choosing Left or Right.  You will choose either Top or Bottom.',
	label: 'Make your choice for this game, either Top or Bottom.',
    strategic: true,
    paid: true,
},
{
    sec: 'experiment',
    sec_rnd: 0,
    type: 'chooseOutcome',
	title: 'Question 1.2',
	text: 'Hypothetically, if you had control over both your choice and the other player\'s, and were to decide how much each of you earn in this game, which of the four outcomes would you prefer?',
	label: 'Select one of the four game outcomes.',
},
{
    sec: 'experiment',
    sec_rnd: 1,
    type: 'chooseStrategy',
	title: 'Question  2.1',
	text: 'You are now playing a slight different game with the same person.  They are choosing Left or Right.  You will choose either Top or Bottom.',
	label: 'Make your choice for this game, either Top or Bottom.',
    strategic: true,
    paid: true,
},
{
    sec: 'experiment',
    sec_rnd: 1,
    type: 'chooseOutcome',
	title: 'Question 2.2',
	text: 'Hypothetically, if you had control over both your choice and the other player\'s, and were to decide how much each of you earn in this game, which of the four outcomes would you prefer?',
	label: 'Select one of the game outcomes.',
},
{
    sec: 'experiment',
    sec_rnd: 3,
    type: 'chooseGame',
	title: 'Question 3',
	text: 'You will now select one of the games to play a second time.  Which game would you prefer to play again?',
	label: 'Select one of the games below.',
},
{
    sec: 'experiment',
    sec_rnd: 4,
    type: 'chooseStrategy',
	title: 'Question 4',
	text: 'This is the last game of the section.  Make your choice.',
	label: 'Make your choice for this game, either Top or Bottom.',
    strategic: true,
    paid: true,
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What country are you from?',
    options: countryCodes,
    paid: true,
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'text',
	label: 'Enter your postal code. If you are in the USA, enter your 5-digit zip code.',
    pattern: "([0-9]+)|(xxxxxx)",
    fieldName: "Postal code",
    paid: true,
},// regex: ^(?:\d{5})?$
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What is your sex?',
    options: ['Female','Male','Other','Decline to state'],
    paid: true,
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'text',
	label: 'What is your age?',
    pattern: "([1]?[0-9]{1,2})|(xxxxxx)",
    fieldName: "Your age",
    paid: true,
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
    paid: true,
},
{
    sec: 'survey',
    sec_rnd: 0,
    type: 'dropdown',
	label: 'What is the number of people in your household?',
    options: _(1).range(7).map(_.toString).concat( '7+', 'Decline to state').value(),
    paid: true,
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
let questionsAddendum = [];
QuestionData.questions.forEach ( function(q) {
    _.assign( q, {
        choice: null,
        answered: false,
        disabled: false,
        hasError: false,
        order : _.indexOf(QuestionData.questions, q),
    });
    if( _.isNil(q.paid) || !q.paid ) { q.paid = false; }
    if( _.isNil(q.strategic) || !q.strategic ) { q.strategic = false; }
    if( q.sec === 'quiz' ) {
        q.correct = false;
        q.payoffs = [3,1,4,2,3,1,4,2];
    } else if( q.sec === 'experiment' ) {
        q.sec = 'experiment2';
        questionsAddendum = _.concat(questionsAddendum, _.clone(q) );
        q.sec = 'experiment1';
    }
    //console.log(q);
    //Meteor.call("addQuestion", questions[q]);
});
QuestionData.questions = _.concat(QuestionData.questions, questionsAddendum);


