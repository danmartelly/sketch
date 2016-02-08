import random
import criteria
import dataFuncs
import graphUtil as util

def magicGrade():
    return (random.random()*100, 'random grade')

# studentData is a JSON string contains axes data, drawing data, critical point data
# problemID is a string
def gradeProblem(studentData, problemID):
    grader = criteria.createGraderFromProbID(problemID)
    graphData = util.GraphData(studentData)
    grade = grader.grade(graphData)
    return (grade[0]*100, grade[1])

# test
'''user = ''
import hashlib
khash = hashlib.sha224(user).hexdigest()
probID = 'domainTest'
jsonString = dataFuncs.getStudentData(khash, probID)
g = util.GraphData(jsonString)
print gradeProblem(jsonString, probID)'''
