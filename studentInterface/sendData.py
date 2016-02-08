#!/usr/bin/python
import os
import dataFuncs
import grader
import cgi
import cgitb
import json
cgitb.enable()

form = cgi.FieldStorage()
error = '''
"error": 'Missing data. Only received %(formKeys)s 
''' % {'formKeys':form.keys()}

if 'request' in form and str(form['request'].value) == 'submitStudentData' and\
        all([k in form for k in ['saveData', 'kerberosHash', 'problemID']]):
    d = str(form['saveData'].value)
    kh = str(form['kerberosHash'].value)
    pid = str(form['problemID'].value)
    decd = json.loads(d)
    if 'recording' in decd:
        record = decd['recording']
        dataFuncs.saveStudentRecording(kh, pid, str(record))
    d = str(d)
    dataFuncs.saveStudentData(kh, pid, d)
    grade, feedback = grader.gradeProblem(d, pid)
    print '''
{"grade":%(grade)s, "feedback":"%(feedback)s"}''' % {'grade':str(grade), 'feedback':feedback}
else:
    print error
