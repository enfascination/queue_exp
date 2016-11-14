/*jshint esversion: 6 */

import { Router } from 'meteor/iron:router';

Router.route('/', function() {
    this.render('home');
});


Router.route('/start', function() {
    this.render('quizNav');
});
Router.route('/experiment', function() {
    this.render('experimentNav');
});
Router.route('/submitHIT', function() {
    this.render('submitNav');
});
