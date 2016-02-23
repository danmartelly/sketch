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
    criticalData = {}
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

def generate(visualOptions, criteriaOptions, generatorFunc, quantity=1):
    #extract axis data
    axisData = {}
    axisData['xaxis'] = visualOptions['xaxis']
    axisData['xaxis']['pixels'] = axisData['xaxis'].pop('pixelDim')
    axisData['yaxis'] = visualOptions['yaxis']
    axisData['yaxis']['pixels'] = axisData['yaxis'].pop('pixelDim')
    #extract grader
    grader = criteria.createGrader(criteriaOptions['criteria'])
    answers = []
    for i in range(quantity):
        answers.append(generatorFunc(axisData, grader))
    return answers
