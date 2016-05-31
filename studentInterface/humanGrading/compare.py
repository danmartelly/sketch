import dataFuncs

people = ["ajeisens", "diana", "kasmus", "martelly", "emartelly", "fjgarza3"] 
computer = "computer"

questions = []
questions.extend(['thevenins.q00000'+str(i) for i in range(3)]) # can go up to 3
questions.extend(["power.q00000"+str(i) for i in range(1,7)])
questions.append("nyan.q000005")
questions.extend(["potLoading.q00000"+str(i) for i in range(5)])

peopleAgreement = {} #key criterion, value {numberWhoAgree: 3}
def addToAgree(criterionType, numberWhoAgree):
   if criterionType not in peopleAgreement:
      peopleAgreement[criterionType] = {}
   if numberWhoAgree not in peopleAgreement[criterionType]:
      peopleAgreement[criterionType][numberWhoAgree] = 1
   else:
      peopleAgreement[criterionType][numberWhoAgree] += 1

computerAndPeople = {} #key criterion, value {tp:2, tn:3, fp:1, fn:1}
def addToCompAndPeeps(criterionType, consensus, computer):
   if criterionType not in computerAndPeople:
      computerAndPeople[criterionType] = {'tp':0, 'tn':0, 'fp':0, 'fn':0}
   if consensus == 'true': 
      if computer == 'true': key = 'tp'
      else: key = 'fn' 
   else:
      if computer == 'true': key = 'fp'
      else: key = 'tn'
   computerAndPeople[criterionType][key] += 1

totalAnswers = 0
totalDrawings = 0
numberAgreedOn = 0

peopleData = []
for p in people:
   f = open("teacherData/" +p+".txt", 'r')
   personData = eval(f.read())
   f.close()
   peopleData.append(personData)

computerData = dataFuncs.getTeacherData(computer)

for q in questions:
   criteria = dataFuncs.getCriteria(q)
   for k in peopleData[0][q]: # kerberos
      totalDrawings += 1
      for i in range(len(criteria)):
         totalAnswers += 1

         passes = 0
         fails = 0
         c = criteria[i]
         for pd in peopleData:
            if q not in pd: continue
            person_opinion = pd[q][k][i]
            if person_opinion == 'true': passes += 1
            else: fails += 1
         addToAgree(c['type'],max(passes, fails))
         if max(passes, fails) < 5: continue
         numberAgreedOn += 1
         # if most people agree, lets compare to the computer and see if it agrees
         consensus = 'false'
         if passes > fails: consensus = 'true'
         addToCompAndPeeps(c['type'], consensus, computerData[q][k][i])
         if (consensus != computerData[q][k][i]):
            print(consensus, computerData[q][k][i], q, k, c['type'])

print peopleAgreement
print computerAndPeople
print("totalDrawings", totalDrawings)
print("total Human Criterion judgements", totalAnswers)
print("number of judgements that 5/6 people agreed on", numberAgreedOn)
