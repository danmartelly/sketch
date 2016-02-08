#!/usr/bin/python
import dataFuncs
import os
import hashlib
import cgi
import cgitb
cgitb.enable()

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()
kerberosHash = hashlib.sha224(user).hexdigest() 
probIDs = ['thicken1','thicken2','thicken3']


print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta charset='utf-8'/>
	<title>The Plot Thickens</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	<script type='text/javascript' src='../sketchGraphsV2.js'></script>
</head>
<body>
	<h3>The Plot Thickens...</h3>
	<p> (Adapted from Fall 2013 Midterm 2 question of same name) Bored on a Friday night, Lem E. Tweakit decided it would be fun to experiment with the IR distance sensor he built in software lab. 
	He generated plots by getting the robot to move at a constant velocity away from a light source with different circuit configurations. 
	Unfrotunately, soar crashed and he lost most of his plots before he could save them! 
	The only plot that he has left is from his initial set up. Below is a schematic of his setup and the plot he generated:</p>
	<img src="images/diodeAmpCircuitWeb.png" alt="Amplifier Diagram">
	</img><img src="images/diodeAmpPlotWeb.png" alt="reference plot"></img>
	<p>Help Lem remember the results of his experiment by sketching how the voltage changes over time for the following experimental conditions. 
	The original plot is shown in blue for easy comparison.</p>
	<p><strong>Experiment 1</strong>: Change the resistor R1 to be 250kOhms.
	<div id='thicken1'></div>
	
	<p><strong>Experiment 2</strong>: Replace the op-amp's power supply with 5V and 0V.
	<div id='thicken2'></div>

	<p><strong>Experiment 3</strong>: Halve the speed at which the robot backs away.
	<div id='thicken3'></div>
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
''' % {'kerberosHash':kerberosHash, 'probIDs':probIDs}

