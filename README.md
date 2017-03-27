# instpref installation

git clone git@github.com:enfascination/queue_exp.git -b instpref
mv instpref queue_exp
cd instpref
cp settings.json.min settings.json
git clone https://github.com/TurkServer/turkserver-meteor.git packages/turkserver
meteor add mizzao:turkserver
meteor npm install
meteor run --settings=settings.json
<go to http://localhost:3000/turkserver/>
<at http://localhost:3000/turkserver/ filter for allConds>
<at http://localhost:3000/turkserver/ click Manage>
<at http://localhost:3000/turkserver/ add a treatment and press plus>

