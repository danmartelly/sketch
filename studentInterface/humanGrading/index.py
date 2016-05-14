#!/usr/bin/python
import os
import dataFuncs
import cgi
import cgitb
import sys
cgitb.enable()

form = cgi.FieldStorage()

kerberoses = ['diomidov','jtwright','lroberto', 'jrgraves', 'evab','ezhou','habadio','bsnowden','rbuhai','liangx','trattner', 'kelvinlu', 'tschoen', 'ericluu', 'romero', 'lorenzov', 'jdkaplan', 'aboggust', 'wiliamm','keam','hyshwang','txz','akkas','mshum97','dvuong','zhuw','kevzhao','jbergero','shahp','kwlee','efriis','rruiz','simpsonr','pointing','carbaugh']

mapping = ['Washington','Adams','Jefferson','Madison','Monroe','Adams','Jackson','Buren','Harrison','Tyler','Polk','Taylor','Fillmore','Pierce','Buchanan','Lincoln','Johnson','Grant','Hayes','Garfield','Arthur','Cleveland','Harrison','Cleveland','McKinley','Roosevelt','Taft','Wilson','Harding','Coolidge','Hoover','Roosevelt','Truman','Eisenhower','Kennedy','Johnson','Nixon','Ford','Carter','Reagan','BushSr','Clinton','BushJr','Obama']

questions = []
questions.extend(['thevenins.q00000'+str(i) for i in range(3)]) # can go up to 3
questions.extend(["power.q00000"+str(i) for i in range(1,7)])
questions.append("nyan.q000005")
questions.extend(["potLoading.q00000"+str(i) for i in range(5)])

user = os.environ.get('SSL_CLIENT_S_DN_Email','').split('@')[0].strip()
fullname = os.environ.get('SSL_CLIENT_S_DN_CN',user)

kerberos = kerberoses[0]
president = mapping[0]
questionID = 0 
queryString = os.environ.get('QUERY_STRING','')
queries = queryString.split('&')
for query in queries:
    q = query.split('=')
    if q[0] == 'student':
        try:
            president = q[1]
            kerberos = kerberoses[mapping.index(president)]
        except:
            pass
    if q[0] == 'questionID':
        try:
            questionID = int(q[1])
        except:
            pass
    if q[0] == 'user':
        try:
            user = q[1]
        except:
            pass



if form.has_key('submit'):
    savePresident = form['student'].value
    saveKerberos = kerberoses[mapping.index(savePresident)]
    saveQuestion = questions[int(form['questionID'].value)]
    next_k = dataFuncs.getNextThing(saveKerberos, saveQuestion)
    next_p = mapping[kerberoses.index(next_k)]

    criteriaList = dataFuncs.getCriteriaCheckboxList(saveQuestion)
    user = form['user'].value
    answers = []
    for i in range(1,len(criteriaList)+1):
        if form.has_key(str(i)):
           answers.append('true' if form[str(i)].value == 'on' else 'false')
        else:
           answers.append('false')
    dataFuncs.saveTeacherGrade(user, saveQuestion, saveKerberos, answers)
    print 'Location: ?student=%(next_pres)s&questionID=%(index)s&user=%(user)s'\
         % {'next_pres': next_p, 'index': form['questionID'].value, 'user':user}

elif form.has_key('selectUsername'):
    print 'Location: ?student=%(president)s&questionID=%(index)d&user=%(username)s' \
         % {'president': president, 'index': questionID, 'username':form['username'].value}

question = questions[questionID]
next_questionID = (questionID + 1) % len(questions)

imageSrc = "images/" + question.replace('.','') + ".png"

for i in range(len(kerberoses)):
    try:
        studentData = dataFuncs.getStudentData(kerberos, question)
        break
    except:
        kerberos = kerberoses[i]
        president = mapping[i]
    
displayData = dataFuncs.getDisplayData(question)
criteriaList = dataFuncs.getCriteriaCheckboxList(question)
next_kerberos = dataFuncs.getNextThing(kerberos, question)
next_pres = mapping[kerberoses.index(next_kerberos)]
lastGrade = dataFuncs.getTeacherGrade(user, question, kerberos)

numberGraded = 0 #len(dataFuncs.getResponseData(user)) - 1
thanksText = ""
if numberGraded == 0:
    thanksText = "Don't be scared to enter a grade."
elif numberGraded <= 3:
    thanksText = "This isn't so hard. Right?"
elif numberGraded <= 10:
    thanksText = "You're getting pretty good at this."
elif numberGraded <= 15:
    thanksText = "I'll keep you entertained with a few puns."
elif numberGraded <= 18:
    thanksText = "Why can't a bicycle stand up?....."
elif numberGraded <= 22:
    thanksText = "...Because it's too/2 tired."
elif numberGraded <= 25:
    thanksText = "What do you call a seagull flying around a bay?....."
elif numberGraded <= 27:
    thanksText = "...A bagel!"
elif numberGraded <= 29:
    thanksText = "A man just assaulted me with milk, cream, and butter. How dairy."
elif numberGraded <= 34:
    thanksText = "When the window fell into the incinerator, it was a pane in the ash to retrieve"
elif numberGraded <= 40:
    thanksText = "What's the difference between a giant panda, and a criminal in a resaturant?"
elif numberGraded <= 45:
    thanksText = "One eats shoots and leaves, the other eats, shoots, and leaves."
else:
    thanksText = "Unfortunately, I've run out of clever things to say. Thank you so much though!"



if user == "":
    print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>Grade Graphs Please</title>
</head>
<body>
<div>
<form>
Choose a username (preferably your kerberos): 
<input name="username" type="text"></input>
<input type="submit" name="selectUsername"></input>
</form>
</div>
</body>
</html>
''' 
else:
    print '''
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<script type="text/javascript" src="../../jquery-1.12.2.min.js"></script>
	<script type="text/javascript" src="../../sketchGraphsV2.js"></script>
	<script type="text/javascript" src="../../sketchTools.js"></script>
	</script>

	<title>Grade Graphs Please</title>
</head>
<body>
You're grading %(president)s on question %(question)s.<br>
You are %(user)s. You've graded %(numberGraded)d. %(thanksText)s
<br>
<div id="sketchArea"></div>
<div id="answerArea" style="position:absolute;left:700px;top:20px;border-style:solid;">
	<h3>Correct answer</h3>
	<img src=%(imageSrc)s></img>
</div>
<div id="functionArea"></div>
<form id="formArea">
</form>
<a href="?student=%(next_pres)s&questionID=%(questionID)d&user=%(user)s">Go to next student</a>
<br><br>
<a href="?questionID=%(next_questionID)d&user=%(user)s">Go to next question</a>
</div>
</body>
<script type="text/javascript">

var sk = new SketchInterface(document.getElementById('sketchArea'), %(displayData)s);
sk.submitToolbar.removeSelf();
sk.processStudentData(%(studentData)s);
sk.drawingToolbar.removeSelf();

checkboxes = %(criteriaList)s;
lastGrade = %(lastGrade)s;
var addListener = function (cb) {
	var checkbox = cb;
	window.addEventListener("keydown", function(e) {
		if (e.key == checkbox.name || e.code.indexOf(checkbox.name) >= 0) {
			checkbox.checked = !checkbox.checked;
		}
	})
};

var f = document.getElementById('formArea');
var q = document.createElement('input');
q.name = 'questionID';
q.type = 'text';
q.value = %(questionID)s;
q.style.display = 'none';
f.appendChild(q);
var u = document.createElement('input');
u.name = 'user';
u.type = 'text';
u.value = "%(user)s";
u.style.display = 'none';
f.appendChild(u);
var s = document.createElement('input');
s.type = 'text';
s.name = 'student';
s.value = "%(president)s";
s.style.display = 'none';
f.appendChild(s);
for (var i = 0; i < checkboxes.length; i++) {
	var num = document.createTextNode((i+1) + ". ");
	f.appendChild(num)
	var cb = document.createElement('input');
	cb.name = (i+1);
	cb.type = 'checkbox';
	cb.checked = lastGrade[i] == 'true';
	f.appendChild(cb);
	var tn = document.createTextNode(checkboxes[i]);
	f.appendChild(tn);
	f.appendChild(document.createElement('br'));
	addListener(cb);
}
var sb = document.createElement('input');
sb.type = 'submit';
sb.name = 'submit';
sb.value = "Submit(Spacebar)";
window.addEventListener("keydown", function(e) {
	if (e.key == " " || e.code == "Space") {
		sb.click();
	}
});
f.appendChild(sb);
</script>
</html>
''' % {"user":user, 'numberGraded':numberGraded, 'imageSrc':imageSrc, 'thanksText':thanksText, 'president':president, 'question':question, 'studentData':studentData, 'displayData':str(displayData), 'next_pres':next_pres, 'questionID':questionID, 'criteriaList':criteriaList, 'next_questionID':next_questionID, 'user':user, 'lastGrade':str(lastGrade)}
