#!/usr/bin/python
import os
import cgi
import cgitb
import dataFuncs
cgitb.enable()

form = cgi.FieldStorage()
error = '''
{"error":'error. Missing data. Only received %(formKeys)s'}''' % {'formKeys':form.keys()}

if 'request' in form and str(form['request'].value) == 'getOptions' and\
        all([k in form for k in ['problemID']]):
    pid = str(form['problemID'].value)
    data = dataFuncs.getOptionsData(pid)
    print '''
%(data)s''' % {'data':data}
elif 'request' in form and str(form['request'].value) == 'getStudentData' and\
        all([k in form for k in ['problemID', 'kerberosHash']]):
    pid = str(form['problemID'].value)
    kh = str(form['kerberosHash'].value)
    data = dataFuncs.getStudentData(kh, pid)
    print '''
%(data)s''' % {'data':data}
elif 'request' in form and str(form['request'].value) == 'getStudentRecording' and\
        all([k in form for k in ['problemID', 'kerberosHash']]):
    pid = str(form['problemID'].value)
    kh = str(form['kerberosHash'].value)
    data = dataFuncs.getStudentRecording(kh, pid)
    print '''
%(data)s''' % {'data':data}
else:
    print error
