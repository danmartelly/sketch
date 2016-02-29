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

if 'request' in form and str(form['request'].value) == 'generateAnswer' and\
        all([k in form for k in ['criteriaOptions','visualOptions']]):
    co = str(form['criteriaOptions'].value)
    vo = str(form['visualOptions'].value)
    a = answerGenerator.generate(vo, co, answerGenerator.generateRandomAnswer)
    print '''
%(a)s
''' % {'a':json.dumps(a)}
    
else:
    print error
