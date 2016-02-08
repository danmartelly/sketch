#!/usr/bin/python
import os
import hashlib
import cgi
import cgitb
import ast
cgitb.enable()

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()

if user != 'martelly' and user != 'hartz':
    print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta charset='utf-8'/>
	<title>Results</title>
</head>
<body>
	%(user)s: not allowed
</body>
</html>
''' % {'user':user}
else:
    f = open('mthesishtmls.txt', 'r')
    d = ast.literal_eval(f.read())
    try:
        queryString = os.environ.get('QUERY_STRING','')
        query = queryString.split("&")[0].split('=')[1]
        if query in d:
            print "\n" + d[query]
        else:
            print "\n" + d['navigation']
    except:
        print "\n" + d['navigation']
    f.close()

