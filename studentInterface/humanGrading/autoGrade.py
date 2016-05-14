import sys
import dataFuncs
sys.path.append('..')

import criteria
import graphUtil

questions = []
questions.extend(['thevenins.q00000'+str(i) for i in range(3)]) # can go up to 3
questions.extend(["power.q00000"+str(i) for i in range(1,7)])
questions.append("nyan.q000005")
questions.extend(["potLoading.q00000"+str(i) for i in range(5)])

kerberoses = ['diomidov','jtwright','lroberto', 'jrgraves', 'evab','ezhou','habadio','bsnowden','rbuhai','liangx','trattner', 'kelvinlu', 'tschoen', 'ericluu', 'romero', 'lorenzov', 'jdkaplan', 'aboggust', 'wiliamm','keam','hyshwang','txz','akkas','mshum97','dvuong','zhuw','kevzhao','jbergero','shahp','kwlee','efriis','rruiz','simpsonr','pointing','carbaugh']

user = 'computer'

for q in questions:
   print(q)
   critDicts = dataFuncs.getCriteria(q)
   critObjs = []
   # create list of criteria
   for c in critDicts:
      clazz = getattr(criteria, c['type'] + "Criteria")
      inst = clazz(c['args'])
      critObjs.append(inst)
   for k in kerberoses:
      graphJSON = dataFuncs.getStudentData(k, q)
      if graphJSON == None: continue
      print('\t' + k)
      graphData = graphUtil.GraphData(graphJSON)
      answers = []
      for c in critObjs:
         grade = c.grade(graphData)[0]
         answers.append('true' if grade >= 1 else 'false')
      dataFuncs.saveTeacherGrade(user, q, k, answers)


print("done")
