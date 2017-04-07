#!/usr/bin/env python
'''
Script to download Mongo DBs from lab server. Currently configured to work with experiments.cosanlab.com studies 
Works by:
1) opening SSH with portforwarding on Lab Remote Server (Digital Ocean)
2) pulling and pickling current version of Mongo DBs
3) creating log file with info about redunancies with previously pulled DBs 

Requires:
- mongodb
- pymongo
- ssh key access to experiments.cosanlab.com
'''
import pickle, os
import pymongo as pm
import sys

#START FUNCTION DEFS
def sshTunnel(command):
    if command == 'check':
        checkSSH()
    elif command == 'open':
        checkSSH()
        port = openSSH()
        return port
    elif command == 'close':
        closeSSH()
    else:
        raise Exception('Valid commands are: check, open, close')

def checkSSH():
    '''Function to check if any background ssh tunnels with portforwarding exist for the remote Mongodb server'''
    from subprocess import check_output
    PIDs = check_output("ps aux | grep localhost:27017 | grep -v grep | awk '{print $2}'",shell=True).splitlines()
    if len(PIDs) > 0:
        print "There are " + str(len(PIDs)) + " open connections to the remote Mongo server."
        while True:
            resp = raw_input('Do you want to kill them? (y) or (n) ')
            if resp == 'y':
                closeSSH(PIDs)
                break
            elif resp == 'n':
                activePorts = [process.partition(':localhost')[0] for process in check_output("ps aux | grep localhost:27017 | grep -v grep | awk '{print $15}'",shell=True).splitlines()]
                print "Ok. Connections still active. If opening a new connection don't use port(s): " + ', '.join(activePorts)
                break
            else:
                print "Enter (y) or (n) only."
                continue           
    else:
        print "There are no open connections to the remote Mongo server."

def openSSH():
    '''Function to create a new ssh tunnel with portforwarding to specified port'''
    from subprocess import call
    port = raw_input('What port would you like to use for forwarding? (e.g. 4321 or exit) ')
    if port == 'exit':
        print 'Ok. Goodbye!'
    else:
        call('ssh -N -f -L ' + port + ':localhost:27017 root@experiments.cosanlab.com',shell=True)
        print 'Successfully opened ssh tunnel on port ' + port + '!'
    return port  

def closeSSH(*args):
    '''Function to kill processes with PIDs corresponding to background Mongodb specific ssh tunnels.'''
    from subprocess import check_output
    if len(args) == 0:
        PIDs = check_output("ps aux | grep localhost:27017 | grep -v grep | awk '{print $2}'",shell=True).splitlines()
    elif len(args) > 1:
        raise Exception('Too many input arguments!')
    else:
        PIDs = args[0]
    try:
        for process in PIDs:
            check_output("kill " + process, shell=True)
        print 'All connections successfully closed!'
    except:
        'Error could not close connections.'   

#END FUNCTION DEFS

#Create a new tunnel
port = sshTunnel('open')
if port == 'exit':
    sys.exit()
#Create pymongo client with portforwarding
client = pm.MongoClient('localhost',int(port))
#Meteor UG database
studyDB = client.instpref
#Grab specific games databases
cohortdb = studyDB.designs
substatdb = studyDB.s_status
substatbakdb = studyDB.s_status_bak
subdatadb = studyDB.s_data
questionsdb = studyDB.questions
experimentsdb = studyDB.ts.experiments
assignmentsdb = studyDB.ts.assignments

#Pickle the dbs
dataFolder = raw_input('Provide folder name for saving databases: ')

if not os.path.exists(os.path.join(os.getcwd(),dataFolder)):
    os.makedirs(os.path.join(os.getcwd(),dataFolder))

Cohorts = [ d for d in cohortdb.find() ]
SubStat = [ d for d in substatdb.find() ] + [ d for d in substatbakdb.find() ]
SubData = [ d for d in subdatadb.find() ]
Questions = [ d for d in questionsdb.find() ]
Experiments = [ d for d in experimentsdb.find() ]
Assignments = [ d for d in assignmentsdb.find() ]
if not (Cohorts and SubStat and SubData and Questions and Experiments and Assignments):
    print "ERROR: One of the databases is empty. Did you mistype its name?"
    sshTunnel('close');
    quit()

pickle.dump(Cohorts, open(os.path.join(os.getcwd(),dataFolder,"Cohorts.p"),"wb"))
pickle.dump(SubStat, open(os.path.join(os.getcwd(),dataFolder,"SubStat.p"),"wb"))
pickle.dump(SubData, open(os.path.join(os.getcwd(),dataFolder,"SubData.p"),"wb"))
pickle.dump(Questions, open(os.path.join(os.getcwd(),dataFolder,"Questions.p"),"wb"))
pickle.dump(Experiments, open(os.path.join(os.getcwd(),dataFolder,"Experiments.p"),"wb"))
pickle.dump(Assignments, open(os.path.join(os.getcwd(),dataFolder,"Assignments.p"),"wb"))
print "Successfully pickled all databases!\n"


#Create logs
containsDBs = raw_input('Provide a list of dbs already contained in this db separated by commas: ')
try:
    if containsDBs:
        containsDBs = containsDBs.split(',')
        with open(os.path.join(dataFolder,'contains.txt'),'w') as f:
            for db in containsDBs:
                f.write(db.strip()+ '\n')
        print "Successfully wrote log file!\n"
    else:
        open(os.path.join(dataFolder, 'contains.txt'),'w').close()
        print "Successfully wrote empty log file!\n"
except:
    print "Error when writing log file!\n"

#Close port forwarding
sshTunnel('close');

#Make sure everything went ok
    

