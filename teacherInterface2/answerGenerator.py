import os
import sys
sys.path.append(os.path.join("..","studentInterface"))
import criteria
import graphUtil as util
import json
import random

#Given grader (which contains criteria) and axis data,
# generate a bunch of answers
def generateRandomAnswer(axisData, grader):
    # unpack axisData
    pixelHeight = int(axisData['yaxis']['pixels'])
    ymin = float(axisData['yaxis']['min'])
    ymax = float(axisData['yaxis']['max'])
    ystep = float(axisData['yaxis']['step'])
    pixelWidth = int(axisData['xaxis']['pixels'])
    xmin = float(axisData['xaxis']['min'])
    xmax = float(axisData['xaxis']['max'])
    xstep = float(axisData['xaxis']['step'])
    # go from left to right and put random pixels
    blackPixels = []
    for i in range(pixelWidth):
        blackPixels.append({'i':i, 'j':int(random.random()*pixelHeight)})
    drawingData = {'blackPixels':blackPixels}
    criticalData = {'usedPointList':[]}
    return {'axes':axisData, 'drawing':drawingData, 'criticalPoints':criticalData}

def generateGreedyDecisions(axisData, grader):
    # unpack axisData
    pixelHeight = int(axisData['yaxis']['pixels'])
    ymin = float(axisData['yaxis']['min'])
    ymax = float(axisData['yaxis']['max'])
    ystep = float(axisData['yaxis']['step'])
    pixelWidth = int(axisData['xaxis']['pixels'])
    xmin = float(axisData['xaxis']['min'])
    xmax = float(axisData['xaxis']['max'])
    xstep = float(axisData['xaxis']['step'])
    otherVars = {'xmin':xmin, 'xmax':xmax, 'ymin':ymin, 'ymax':ymax,
        'pixelWidth':pixelWidth, 'pixelHeight':pixelHeight}
    # go from left to right and for each criteria
    # figure out what works
    stroke = []
    criteriaStates = [None for c in grader.criteria]
    # go from left to right
    for i in range(pixelWidth):
        # here are all the next pixels we are considering
        possible = {(i,j):0 for j in range(pixelHeight)}
        # each criteria will add a score to possible dictionary
        for critIndex in range(len(grader.criteria)):
            crit = grader.criteria[critIndex]
            state = criteriaStates[critIndex]
            crit.updatePossibleScores(stroke, state, possible, otherVars)
        # choose best score
        nextPix = max(possible, key=lambda x:possible[x])
        stroke.append(nextPix)
    # convert stroke to graph data
    blackPixels = []
    for (i,j) in stroke:
        blackPixels.append({'i':i, 'j':j})
    drawingData = {'blackPixels':blackPixels}
    criticalData = {'usedPointList':[]}
    return {'axes':axisData, 'drawing':drawingData, 'criticalPoints':criticalData}

def getVisualOptionsFromFile(filename):
    f = open(filename, 'r')
    data = json.loads(f.read())
    f.close()
    return data

def getCriteriaOptionsFromFile(filename):
    f = open(filename, 'r')
    data = f.read()
    data = json.loads(data.replace("'",'"'))
    f.close()
    return data

def convertStringToDict(string):
    # try json.loads
    try:
        data = json.loads(string)
        return data
    except:
        pass
    # try json.loads iwth replacing quotation marks
    try:
        data = json.loads(string.replace("'",'"'))
        return data
    except:
        pass
    # maybe it's a dictionary
    try:
        data = dict(string)
        return data
    except:
        pass
        

def generate(visualOptions, criteriaOptions, generatorFunc, quantity=2):
    if isinstance(visualOptions,basestring):
        visualOptions = convertStringToDict(visualOptions)
    if isinstance(criteriaOptions, basestring):
        criteriaOptions = convertStringToDict(criteriaOptions)
    #extract axis data
    axisData = {}
    axisData['xaxis'] = visualOptions['xaxis']
    axisData['xaxis']['pixels'] = axisData['xaxis'].pop('pixelDim')
    axisData['yaxis'] = visualOptions['yaxis']
    axisData['yaxis']['pixels'] = axisData['yaxis'].pop('pixelDim')
    #extract grader
    grader = criteria.createGrader(criteriaOptions)
    answers = []
    for i in range(quantity):
        genData = generatorFunc(axisData, grader)
        (score, feedback) = grader.grade(util.GraphData(json.dumps(genData)))
        answers.append({'data':genData,'score':score, 'feedback':feedback})
    return answers

#vo = {"xaxis":{"min":"-2","max":"2","step":1,"pixelDim":"500"},"yaxis":{"min":"-2","max":"2","step":1,"pixelDim":"300"}}
#co = [{'type':'FunctionFollowed', 'args':{'f':'lambda x: x**2 - 1'}}]
#print(generate(vo, co, generateGreedyDecisions,1))