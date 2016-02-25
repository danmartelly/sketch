#!/usr/bin/python
import os
import sys
sys.path.append(os.path.join("..","studentInterface"))
import dataFuncs
import grader
import cgi
import cgitb
import json
cgitb.enable()

from = cgi.FieldStorage()
error = '''
"error": 'Missing data. Only received %(formKeys)s'
''' % {'formKeys':form.keys()}

print error