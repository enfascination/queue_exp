
# local installation

(assumes you have meteor installed)

git clone git@github.com:enfascination/queue_exp.git\
cd queue_exp\
cp settings.json.min settings.json\
git clone https://github.com/TurkServer/turkserver-meteor.git packages/turkserver\
meteor add mizzao:turkserver\
meteor npm install\
meteor run --settings=settings.json\
(note: in 2019 to build on Windows Windows I had to bump the bcrypt version to 1.0.0 due to a Visual C++ bug with 0.8.7; see comment in package.json file)\

go to http://localhost:3000/turkserver/
at http://localhost:3000/turkserver/ filter for allConds
at http://localhost:3000/turkserver/ click Manage
at http://localhost:3000/turkserver/ add a treatment and press plus
in a browser with separate cookies visit http://localhost:3000/ to simulate user

## `training` branch review notes
- This branch adds two new sections of 'practice' questions designed to test and improve subjects' understanding of the game. The Practice section questions are similar to the Quiz section questions in that they have correct answers, however unlike the Quiz subjects are paid for each correct answer.  Similar to the Quiz, repeat subjects will skip the Practice section.
- All changes are tagged with string "BJM", except for some edits to the README installation section above
- **6 changes tagged "REDALERT" need to be reviewed**, e.g. two particularly important ones:
	- the experiment max bonus needs updating to include the total potential earnings from the training questions (in api/design/models.js)
	- the functionality of repeat subjects skipping the Practice section has **not** been tested; I was unable to simulate a repeat subject, even connecting to an Mturk/AWS account, possibly because my local app isn't using https; I believe this functionality is  restricted to a single block of code I've gone ahead and written (in client/templatejs/experiment.js)
	- others include changes I was patterning but don't entirely understand
- 8 changes tagged "YELLOWALERT" likely do not need review; e.g. more minor changes I understand less than fully, or a note where I've made a programming decision that may not be flexible


