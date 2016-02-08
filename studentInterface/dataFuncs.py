import os
import ast

studentDataDir = './studentData/'
questionDataDir = './questionData/'
criteriaDataDir = './criteriaData/'

def saveStudentData(kerberosHash, problemID, saveData):
    filename = studentDataDir + kerberosHash + '_' + problemID + '.txt'
    f = open(filename, 'w')
    f.write(saveData)
    f.close()

def saveStudentRecording(kerberosHash, problemID, recording):
    filename = studentDataDir + kerberosHash + '_' + problemID + '-recording.txt'
    # Append new recording data to end of file
    f = open(filename, 'a')
    f.write("\n")
    f.write(recording)
    f.close()

def getStudentData(kerberosHash, problemID):
    filename = studentDataDir + kerberosHash + '_' + problemID + '.txt'
    if not os.path.isfile(filename):
        return '{}'
    f = open(filename, 'r')
    data = f.read()
    f.close()
    return data

def getOptionsData(problemID):
    filename = questionDataDir + problemID + '.txt'
    if not os.path.isfile(filename):
        return '{}'
    f = open(filename, 'r')
    data = f.read()
    f.close()
    return data

def getStudentRecording(kerberosHash, problemID):
    filename = studentDataDir + kerberosHash + '_' + problemID + '-recording.txt'
    fullRecording = []
    f = open(filename, 'r')
    for line in f:
        d = None
        try:
            d = ast.literal_eval(line)
        except:
            continue
        if type(d) == type([]):
            fullRecording.extend(d)
    f.close()
    fullRecording = str(fullRecording)
    fullRecording = fullRecording.replace("'",'"')
    return fullRecording

def getCriteriaData(name):
    filename = criteriaDataDir + name + '.txt'
    f = open(filename, 'r')
    d = f.read()
    f.close()
    d = d.replace("'", '"')
    return d
