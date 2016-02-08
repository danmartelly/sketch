#!/usr/bin/python
import dataFuncs
import os
import hashlib
import cgi
import cgitb
cgitb.enable()

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()
kerberosHash = hashlib.sha224(user).hexdigest() 
probIDs = ['nyanInverter']


print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta charset='utf-8'/>
	<title>Cats and Keyboards</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	<script type='text/javascript' src='../sketchGraphsV2.js'></script>
</head>
<body>
	<h3>Sensing</h3>
	<p>Your cat, Nyan, keeps finding a way into your box of Tart Pops leaving you with nothing to eat for breakfast, lunch or dinner.
	You know Nyan doesn't like being sprayed with water and you're able to figure out a way to automatically spray water near your Tart Pops whenever the device has a 10V drop across it.
	The next thing you do is build a breakbeam sensor like so:</p>
	<img src="images/breakbeamSensor.png" alt="breakbeam sensor image"></img>
	<p>The resistor labeled R is a photoresistor. Whenever Nyan passes between the light and photoresistor (on her way to Tart Pops) the resistance goes down to 300 ohms. Other it stays above 2k ohms.</p>
	<p>What is the voltage Vbb when Nyan is present? Vbb = <input></input></p>
	<p>What is the voltage Vbb when Nyan is <strong>not</strong> present? Vbb = <input></input></p>

	<h3>Amplifying</h3>
	<p>In order to spray Nyan, you amplify the signal (remember you need 10V for the spray to work) through a differential amplifier like the one below:</p>
	<img src="images/diffAmp.png" alt="Diff amp image"></img>
	<p>What is the equation of Vspray in terms of Vbb, Voff, R1, and R2? Vspray = <input></input></p>
	<p>Let R2/R1 = k, find the values of k and Voff which cause spray when Nyan is in the way and sets the value of Vspray to 0V in other situations.<p>
	<p> Voff = <input></input> and k = <input></input></p>

	<h3>Presenting (Optional)</h3>
	<p>Graph what Vspray would look like if you increased Vbb from 0V to 10V</p>
	<div id='nyanInverter'></div>
	<p>This kind of circuit behaves similarly to an inverter as you might see in a digital electronics class. 
	Essentially, invertes take in a high value and make it into a low value and vice-versa. 
	Just like our circuit!</p>
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

