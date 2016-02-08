#!/usr/bin/python
import dataFuncs
import os
import hashlib
import cgi
import cgitb
cgitb.enable()

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()
kerberosHash = hashlib.sha224(user).hexdigest() 
probIDs = ['thevenin1', 'thevenin2', 'thevenin3']

print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta charset='utf-8'/>
	<title>Mixing Thevenins (Optional)</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	<script type='text/javascript' src='../sketchGraphsV2.js'></script>
</head>
<body>
	<h3>Ingredients</h3>
	Circuit 1:
	<img src="images/thevenin1.png" alt="Circuit 1 Image"></img>
	<p>Draw the IV curve for the circuit which describes the relationship between I and V at the terminals.</p>
	<div id='thevenin1'></div>
	Circuit 2:
	<img src="images/thevenin2.png" alt="Circuit 2 Image"></img>
	<p>Draw the IV curve for the above circuit.</p>
	<div id='thevenin2'></div>
	<h3>Mixing</h3>
	<p>Let's represent each circuit as a box and connect them together:</p>
	<img src="images/theveninCombined.png" alt="Mixed Circuit Image"></img>
	<p>How would the IV curve of this circuit look? Think about how the slopes, x-intercepts, and y-intercepts of the first 2 circuits should interact.</p>
	<div id='thevenin3'></div>
</body>
<script text='javascript/text'>
	var probIDs = %(probIDs)s;
	var si;
	for (var i = 0; i < probIDs.length; i++) {
		si = new SketchInterface(document.getElementById(probIDs[i]));
		si.setProblemID(probIDs[i]);
		si.setKerberosHash('%(kerberosHash)s');
	}
</script>
</html>
''' % {'kerberosHash':kerberosHash, 'probIDs':str(probIDs)}

