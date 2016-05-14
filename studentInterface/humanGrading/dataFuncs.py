import os

studentData = 'mthesisDrawingData.txt'
nextThingData = 'nextThing.txt'
teacherData = 'teacherData/'
displayData = 'displayData/'
criteriaData = 'criteriaData/'

def getStudentData(kerberos, question):
   f = open(studentData,'r')
   d = f.read()
   d = eval(d)
   f.close()
   if question in d and kerberos in d[question]:
      return d[question][kerberos]
   return None

def getNextThing(kerberos, question):
   f = open(nextThingData,'r')
   d = f.read()
   d = eval(d)
   f.close()
   return d[question][kerberos]

def getCriteria(question):
   question = question.split('.')
   pre = question[0]
   post = question[1]
   f = open(criteriaData+pre + ".txt")
   exec(f.read())
   f.close()
   return locals()[post]

criteria_text_map = {
'FunctionFollowed':"Function: Does it match the function (as shown in answer picture?",
'DomainUsed':"Use of Domain: Does it cover a sufficient amount of x values?",
'IsFunction':"Is a Function: Does it have a maximum of one y value for every x value?",
'Monotonic':"Monotonicity: ",
'Points':"Points: Does it pass through these points? ",
'Derivative':"Derivative: Does the slope match the function's slope (see picture)? "
}


def getCriteriaCheckboxList(question):
   criteria = getCriteria(question)
   answer = []
   for c in criteria:
      baseStr = criteria_text_map[c['type']]
      if 'domain' in c['args']:
         domain = c['args']['domain']
         baseStr += "from %0.1f to %0.1f" % tuple(domain)
      if 'list' in c['args']:
         baseStr += str(c['args']['list'])
      if 'trend' in c['args'] and c['args']['trend'] == 1:
         baseStr += " is this a monotonically INCREASING (doesn't decrease) function?"
      if 'trend' in c['args'] and c['args']['trend'] == -1:
         baseStr += " is this a monotonically DECREASING (doesn't increase) function?"
      answer.append(baseStr)
   return answer

def getDisplayData(question):
   question = question.split('.')
   pre = question[0]
   post = question[1]
   f = open(displayData+pre + ".txt")
   exec(f.read())
   f.close()
   return locals()[post]

def getTeacherData(user):
   filename = teacherData + user + ".txt"
   if not os.path.isfile(filename):
      return {}
   f = open(filename, 'r')
   d = f.read()
   d = eval(d)
   f.close()
   return d

# access data by d[question][kerberos][criterion] -> true/false
def getTeacherGrade(user, question, kerberos):
   d = getTeacherData(user)
   if question not in d: return []
   if kerberos not in d[question]: return []
   return d[question][kerberos]

def saveTeacherGrade(user, question, kerberos, criteriaChoices):
   filename = teacherData + user + ".txt"
   d = getTeacherData(user)
   if question not in d:
      d[question] = {}
   if kerberos not in d[question]:
      d[question][kerberos] = {}
   d[question][kerberos] = criteriaChoices
   f = open(filename, 'w')
   f.write(str(d))
   f.close()

'''f = open(studentData,'r')
d = f.read()
d = eval(d)
f.close()

what_next = {} #what_next[question][kerberos]

for q in d:
   keys = d[q].keys()
   what_next[q] = {}
   for i in range(len(keys)):
      ker = keys[i]
      next_ker = keys[(i+1)%len(keys)]
      what_next[q][ker] = next_ker
f = open(nextThingData,'w')
f.write(str(what_next))
f.close()'''

