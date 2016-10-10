/*jshint esversion: 6, bitwise:true, browser:true, curly:true, eqeqeq:true, evil:true, forin:true, indent:2, latedef: true, maxerr:50, noarg:true, noempty:true, plusplus:true, regexp:false, undef:true, white:true */

import { Amplify } from 'meteor/amplify';

export const Sess = {
    // getter for subject
    sub : function () {
        return amplify.store("subject");
    },
    setClientSub : function (sub) {
        amplify.store("subject", sub);
    },
}

