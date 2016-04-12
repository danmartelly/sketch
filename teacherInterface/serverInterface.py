#!/usr/bin/python
import os
import sys
sys.path.append(os.path.join("..","studentInterface"))
import grader
import cgi
import cgitb
import json
import answerGenerator
cgitb.enable()

form = cgi.FieldStorage()
error = '''
"error": 'Missing data. Only received %(formKeys)s'
''' % {'formKeys':form.keys()}

if str(form['request'].value) == 'gradeSubmission':
    if not all([k in form for k in ['criteria', 'drawData']]):
        print error
    else:
        d = str(form['drawData'].value)
        co = str(form['criteria'].value)
        grade, feedback = grader.gradeGivenCriteria(d, co)
        feedback = [str(f).replace('"', "").replace("'", "") for f in feedback]
        print '''
{"grade":%(grade)s, "feedback":%(feedback)s}''' % {'grade':str(grade), 'feedback':str(feedback).replace("'",'"')}

    
elif all([k in form for k in ['criteriaOptions','visualOptions', 'request']]):
    genFunc = answerGenerator.generateRandomAnswer
    co = str(form['criteriaOptions'].value)
    vo = str(form['visualOptions'].value)
	
    if str(form['request'].value) == 'random':
        genFunc = answerGenerator.generateRandomAnswer
    elif str(form['request'].value) == 'greedy':
        genFunc = answerGenerator.generateGreedyDecisions
    elif str(form['request'].value) == 'changingGood':
        genFunc = answerGenerator.generateChangingGoodness
    a = answerGenerator.generate(vo, co, genFunc)
    print '''
%(a)s
''' % {'a':json.dumps(a)}
elif str(form['request'].value) == 'saveOptions':
    if not all([k in form for k in ['personName', 'problemName', 'criteria','display']]):
        print error
    else:
        co = str(form['criteria'].value)
        do = str(form['display'].value)
        person = str(form['personName'].value)
        problem = str(form['problemName'].value)
        filenameRoot = problem + person
        currentFiles = filter(lambda x: filenameRoot in x, os.listdir("testingData"))
        bigIndex = 1
        for fil in currentFiles:
            num = int(fil[len(filenameRoot):])
            bigIndex = max(bigIndex, num+1)
        f = open("testingData/" + filenameRoot + str(bigIndex) + ".txt", 'w')
        f.write("criteriaOptions = ")
        f.write(co + "\n\n")
        f.write("displayOptions = ")
        f.write(do + "\n")
        f.close()
        print '''
success %(currentFiles)s''' % {"currentFiles":currentFiles}


    
else:
    print error
