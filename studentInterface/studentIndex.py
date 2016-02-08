#!/usr/bin/python
import dataFuncs
import os
import hashlib
import cgi
import cgitb
cgitb.enable()

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()
kerberosHash = hashlib.sha224(user).hexdigest() 
probID = 'domainTest'


print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta charset='utf-8'/>
	<title>Student Interface test</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	<script type='text/javascript' src='sketchGraphsV2.js'></script>
</head>
<body>
	<div id='sketch'></div>
</body>
<script text='javascript/text'>
	
	var si = new SketchInterface(document.getElementById('sketch'));
	si.setProblemID('%(probID)s');
	si.setKerberosHash('%(kerberosHash)s');
</script>
</html>
''' % {'kerberosHash':kerberosHash, 'probID':probID}

