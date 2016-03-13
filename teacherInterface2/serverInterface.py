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

if all([k in form for k in ['criteriaOptions','visualOptions', 'request']]):
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
    
else:
    print error
