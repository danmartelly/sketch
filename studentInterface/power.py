#!/usr/bin/python
import dataFuncs
import os
import hashlib
import cgi
import cgitb
cgitb.enable()

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()
kerberosHash = hashlib.sha224(user).hexdigest() 
probIDs = ['seriesPower1', 'seriesPower2', 'seriesPower3', 'parallelPower1', 'parallelPower2', 'parallelPower3']


print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta charset='utf-8'/>
	<title>Power Hungry (Optional)</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	<script type='text/javascript' src='../sketchGraphsV2.js'></script>
</head>
<body>
	<h3>Series Power</h3>
	<img src="images/seriesPower.png" alt="Series power circuit"></img>
	<p>Let's look at the circuit above and see how much power is used as we change the resistance R.
	The power consumed by an electrical component can be calculated by P = IV.</p>
	<img src="images/powerEquation.png" alt="Power equation"></img>
	<p><strong>Practice</strong>: What would be the power consumed by the 500 ohm resistor if R = 1000 ohms? <input></input></p>

	<p>Find the equation for the power consumed by each resistor (500 ohms and R) as you increase the resistor R.
	Graph the results for each resistor below as well as the total power consumed.</p>
	<h5>Power consumed by 500 ohm resistor</h5>
	<div id='seriesPower1'></div>
	<h5>Power consumed by resistor R</h5>
	<div id='seriesPower2'></div>
	<h5>Total power consumed by circuit</h5>
        <div id='seriesPower3'></div>
	<p><strong>Check Yourself</strong>: If you had a voltage source with a limited amount of energy, which circuit would run longer?
	A circuit with R=1k ohm or R=1 ohm?<br>
	What about if you were trying to make a heating element for a hot plate? Which circuit would give you more heat?</p>
	
	<h3>Parallel Power</h3>
	<p>Let's look at another circuit.</p>
	<img src="images/parallelPower.png" alt="Parallel power circuit"></img>
	<p>Just like before, find the equation of power consumption for each resistor and graph the results below. 
	Ignore what happens when R = 0.</p>
	<h5>Power consumed by 500 ohm resistor</h5>
	<div id='parallelPower1'></div>
	<h5>Power consumed by resistor R</h5>
	<div id='parallelPower2'></div>
        <h5>Total power consumed by circuit</h5>
        <div id='parallelPower3'></div>
	<p><strong>Check yourself</strong>: Imagine you had some 500 ohm lightbulbs and placed them in the series and parallel circuits above?
	How would the brightness of the bulb change as you varied R? How do you think your home is wired? 
	You can think of the appliances in your home as resistors of different values.</p>
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

