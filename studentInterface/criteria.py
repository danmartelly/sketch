import json
import graphUtil as util
import dataFuncs
import math

def createGrader(criteriaDictList):
    grader = Grader()
    for crit in criteriaDictList:
        t = crit['type']
        clazz = globals()[t + 'Criteria']
        kwargs = {}
        if 'args' in crit:
            for a in crit['args']:
                kwargs[a] = crit['args'][a]
        inst = clazz(kwargs)
        grader.addCriteria(inst)
    return grader

def createGraderFromProbID(probID):
    criteriaString = dataFuncs.getCriteriaData(probID).split('\n')
    for i in range(len(criteriaString)-1,-1,-1):
        if len(criteriaString[i]) > 0 and criteriaString[i][0] == '#':
            criteriaString.pop(i)
    criteriaString = ''.join(criteriaString)
    try:
        j = json.loads(criteriaString)
    except:
        raise Exception('grader parser failed')
    return createGrader(j['criteria'])

class Grader():
    def __init__(self):
        self.criteria = []
        self.feedback = []
        self.score = 0
    def addCriteria(self,crit):
        self.criteria.append(crit)
    def grade(self,graphData):
        self.score = 0
        self.feedback = []
        totalWeight = 0
        for crit in self.criteria:
            totalWeight += crit.weight
            (critPerf, critFeedback) = crit.grade(graphData)
            if crit.failFast and critPerf == 0:
                return critPerf, critFeedback
            self.score += critPerf*crit.weight
            if critFeedback != None: self.feedback.append(critFeedback)
        if totalWeight == 0:
            return 1, ['no criteria used']
        else:
            return self.score/float(totalWeight), self.feedback

class InputArg():
    INTEGER = 0
    FLOAT = 1
    BOOL = 2
    STRING = 3
    LIST = 4
    CODE = 5
    FUNCTION = 6
    SHAPE = 7
    DOMAIN = 8
    mapping = {INTEGER:('integer',int),
        FLOAT:('float',float),
        STRING:('string',str),
        LIST:('list',list),
        CODE:('code',lambda x:x),
        BOOL:('boolean',bool),
        FUNCTION:('function',lambda x:x),
        SHAPE:('shape', lambda x:x),
        DOMAIN:('domain', lambda x:x)
    }
    def __init__(self, name, inputType, default, required=False):
        self.name = name
        self.inputType = inputType
        self.default = default
        self.required = required
    def getDict(self):
        d = {}
        d['name'] = self.name
        d['default'] = self.default
        d['type'] = InputArg.mapping[self.inputType][0] 
        d['required'] = self.required
        return d
    def processInput(self, val):
        return InputArg.mapping[self.inputType][1](val)

class Criteria():
    args = [InputArg('weight',InputArg.FLOAT, 1), 
            InputArg('failFast', InputArg.BOOL, False)]
    failMessage = 'Criteria failed in some way'
    def __init__(self, kwargs):
        missingArgs = []
        unusedArgs = []
        for inp in self.args:
            if inp.name in kwargs:
                setattr(self, inp.name, inp.processInput(kwargs.pop(inp.name)))
            elif inp.required:
                missingArgs.append(inp.name)
            else:
                setattr(self, inp.name, inp.default)
        for k in kwargs:
            unusedArgs.append(k)
        error = ""
        if len(missingArgs) > 0:
            error += 'Missing arguments: ' + str(missingArgs) + "\n"
        if len(unusedArgs) > 0:
            error += "Extra unused arguments: " + str(unusedArgs) + "\n"
        if error != "":
            raise Exception(str(self.__class__) + error)
    # returns grade performance between 0 and 1, and feedback string
    # e.g. .5 means 50%, (.5, 'not all critical points hit')
    def grade(self, graphData):
        raise NotImplementedError
    # otherVars is a dictionary containing xmin, xmax, ymin, ymax, pixelWidth, pixelHeight
    def unpackOtherVars(self, otherVars):
        xmin = otherVars['xmin']
        xmax = otherVars['xmax']
        ymin = otherVars['ymin']
        ymax = otherVars['ymax']
        pixelWidth = otherVars['pixelWidth']
        pixelHeight = otherVars['pixelHeight']
        return (xmin, xmax, ymin, ymax, int(pixelWidth), int(pixelHeight))
    def filteredList(self, otherVars, boolFuncXY):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        answer = []
        for i in range(pixelWidth):
            x = xmin + i*(xmax-xmin)/pixelWidth
            for j in range(pixelHeight):
                y = ymax - j*(ymax-ymin)/pixelHeight
                if boolFuncXY(x,y):
                    answer.append((i,j))
        return answer
    def updatePossibleScores(self,stroke, state, possibleDict, otherVars):
        pass
    def requiredPolygons(self, otherVars):
        return None
    def forbiddenPolygons(self, otherVars):
        return None
    def requiredList(self, otherVars):
        # suggestion: make use of filteredList for other code
        return []
    def forbiddenList(self,otherVars):
        # suggestion: make use of filteredList for other code
        return []
    def isRelationshipPresent(self, otherVars):
        return False
    def relationshipRange(self, otherVars):
        return [0,0]
    def relationshipIcon(self, otherVars):
        return None
    def getCriticalPoints(self, otherVars):
        return []
 
class TestCriteria(Criteria):
    args = Criteria.args + [InputArg('test',InputArg.BOOL,True)]
    def requiredList(self, otherVars):
        return [(1,1),(1,2),(2,2),(2,1)]
    def forbiddenList(self, otherVars):
        return [(11,11),(11,12),(12,12),(12,11)]

class MonotonicCriteria(Criteria):
    failMessage = 'Not monotonic'
    args = Criteria.args + [InputArg('domain',InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('trend', InputArg.INTEGER, 0, True),
                            InputArg('pixelCloseness', InputArg.INTEGER, 10)]
    """Check that data is monotonic. Can also specify whether a positive or
   negative trend is there"""
    def __init__(self, kwargs):
        """ trend = -1 --> must be negative trend
        trend = 0 --> doesn't matter if it's positive/negative, as long as its monotonic
        trend = 1 --> must be positive trend"""
        self.trend = 0
        self.pixelCloseness = 10
        self.domain = (-float('inf'), float('inf'))
        Criteria.__init__(self, kwargs)

    def grade(self, graphData):
        mini, maxi = self.domain
        if mini < graphData.xmin: mini = graphData.xmin
        if maxi > graphData.xmax: maxi = graphData.xmax
        pixelMin = graphData.indexFromXY(mini, 5)[0]
        pixelMax = graphData.indexFromXY(maxi, 5)[0]
        if self.trend == 1 or self.trend == -1:
            windowSize = 40
            diffs = [p for p in graphData.getPixelDiff() if p.x > pixelMin and p.x < pixelMax]
            vals = [p for p in graphData.getFunctionList() if p.x > mini and p.x < maxi]
            if len(diffs) < windowSize:
                if self.trend*sum([p.y for p in diffs]) < 0:
                    return (0., self.failMessage + '1')
                else:
                    return (1., None)
            else:
                windowSum = sum([p.y for p in diffs[:windowSize]])
                maxPixelDiff = 5
                for i in range(windowSize, len(diffs)):
                    windowSum -= diffs[i-windowSize].y
                    windowSum += diffs[i].y
                    if -self.trend*windowSum < -maxPixelDiff:
                        return (0., self.failMessage + '2 ' + str(self.trend) + str(windowSum))
                biggest = -float('inf')
                for p in vals:
                    if self.trend*p.y > biggest:
                        biggest = self.trend*p.y
                    else:
                        diff = biggest - self.trend*p.y
                        pixelDistance = graphData.indexFromXY(0,diff)[1] - graphData.indexFromXY(0,0)[1]
                        if pixelDistance > self.pixelCloseness:
                            return (0., self.failMessage + '3 ' + str(self.trend)  + str(pixelDistance) + ' ' + str(biggest) )
                return (1., None)
        else:
            self.trend = 1
            score1 = self.grade(graphData)
            self.trend = -1
            score2 = self.grade(graphData)
            self.trend = 0
            score = max(score1,score2,key=lambda x:x[0])
            return score
    def updatePossibleScores(self, stroke, state, possibleDict, otherVars):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        prevj = pixelHeight
        if len(stroke) > 0:
            prevj = stroke[-1][1]
        prevy = ymax - prevj*(ymax-ymin)/pixelHeight
        if state == None: state = prevj
        elif trend == 1: state = min(state, prevj)
        elif trend == -1: state = max(state, prevj)
        for (i, j) in possibleDict:
            x = xmin + i*(xmax-xmin)/pixelWidth
            y = ymax - j*(ymax-ymin)/pixelHeight
            if x < self.domain[0] or x > self.domain[1]:
                possibleDict[(i,j)] += self.weight
            elif self.trend == 1:
                multiplier = max(min(1 + float(state-j)/self.pixelCloseness, 1), 0)
                possibleDict[(i,j)] += self.weight*multiplier
            elif self.trend == -1:
                multiplier = max(min(1 + float(j-state)/self.pixelCloseness, 1), 0)
                possibleDict[(i,j)] += self.weight*multiplier

            # TODO: deal with trend = 0

class Shape():
    def withinShape(self, point):
        raise NotImplementedError
    def sizeInMode(self, mode):
        raise NotImplementedError

class Rectangle():
    def __init__(self, kwargs):
        self.left = float(kwargs.pop('left'))
        self.right = float(kwargs.pop('right'))
        self.top = float(kwargs.pop('top'))
        self.bottom = float(kwargs.pop('bottom'))

    def withinShape(self, point):
        return point.x > self.left and point.x < self.right and \
          point.y > self.bottom and point.y < self.top

    def sizeInMode(self, mode):
        if mode == 'x':
            return self.right - self.left
        elif mode == 'y':
            return self.top - self.bottom

class AvoidRegionCriteria(Criteria):
    failMessage = 'Drawing on region which should be avoided'
    args = Criteria.args + [InputArg('shape',InputArg.SHAPE,None),
                            InputArg('fraction',InputArg.FLOAT, .95)]
    '''Check whether or not passed in shape has points
    Required arguments: *shape'''
    def __init__(self, kwargs):
        self.shape = Rectangle(kwargs['shape'])
        kwargs['shape'] = None
        self.fraction = .95
        Criteria.__init__(self, kwargs)
    def grade(self, graphData):
        bad = 0
        for p in graphData.xyPoints:
            if self.shape.withinShape(p):
                bad += 1
        badFraction = bad/float(len(graphData.xyPoints))
        if badFraction > 1-self.fraction:
            return (0., self.failMessage)
        else:
            return (1., None)

class RegionFilledCriteria(Criteria):
    args = Criteria.args + [InputArg('shape',InputArg.SHAPE,None),
                            InputArg('fraction',InputArg.FLOAT, .95)]

    failMessage = 'Did not draw in appropriate region'
    '''Check whether or not passed in shape has points
    Required arguments: *shape
    *mode = 'x' | 'y' '''
    def __init__(self, kwargs):
        self.shape = Rectangle(kwargs['shape'])
        kwargs['shape'] = None
        self.fraction = .9
        self.mode = 'x'
        Criteria.__init__(self, kwargs)

    def grade(self, graphData):
        usedIndices = {} # key would be i index if 'x' mode and j index if 'y' mode
        for p in graphData.xyPoints:
            if self.shape.withinShape(p):
                i, j = graphData.indexFromXY(p.x, p.y)
                if self.mode == 'x':
                    usedIndices[i] = True
                elif self.mode == 'y':
                    usedIndices[j] = True
        XYsize = self.shape.sizeInMode(self.mode)
        if self.mode == 'x':
            pixelSize = XYsize * graphData.pixelWidth / (graphData.xmax - graphData.xmin)
        elif self.mode == 'y':
            pixelSize = XYsize * graphData.pixelHeight / (graphData.ymax - graphData.ymin)
        if len(usedIndices)/float(pixelSize) > self.fraction:
            return (1., None)
        else:
            return (0., self.failMessage)

class PointsCriteria(Criteria):
    args = Criteria.args + [InputArg('list',InputArg.LIST,[],True)]
    failMessage = 'Some critical points were missed'
    '''Check that the drawn graph contains this critical point within some range
    Required arguments: *list: which is a list of 2 length tuples containing (x,y)'''
    def __init__(self, kwargs):
        pointList = kwargs['list']
        kwargs['list'] = None
        self.pList = []
        if type(pointList) != type([]) and type(pointList) != type((0,)):
            pointList = eval(pointList)
        for p in pointList:
            self.pList.append(util.Point(p[0],p[1]))
        self.pixelCloseness = 10
        Criteria.__init__(self, kwargs)
    def grade(self, graphData):
        copyList = self.pList[:]
        for p1Indices in graphData.blackPixels:
            for i in range(len(copyList)-1,-1,-1):
                p2Indices = graphData.indexFromXY(copyList[i].x, copyList[i].y)
                if p1Indices.close(p2Indices, self.pixelCloseness):
                    copyList.pop(i)
                    continue
            if len(copyList) == 0: break
        if len(copyList) == 0:
            return (1., None)
        else:
            return (0., self.failMessage + str(copyList) + 'missed')
        

class DerivativeCriteria(Criteria):
    args = Criteria.args + [InputArg('list',InputArg.LIST,[],True)]
    failMessage = 'The slope of your graph at some important points doesn\' match the answer'
    '''Check that the derivative graph has an appropriate derivative at the given x values
    Required arguments: *list: which is a list of 2 length tuples containing (x, dy/dx)'''
    def __init__(self, kwargs):
        derivList = kwargs['list']
        kwargs['list'] = None
        self.pList = []
        if type(derivList) != type([]) or type(derivList) != type((0,)):
            derivList = eval(derivList)
        for p in derivList:
            self.pList.append(util.Point(p[0],p[1]))
        self.angleCloseness = math.pi/7.
        Criteria.__init__(self, kwargs)
        
    def grade(self, graphData):
        derivFunc = graphData.getSmoothDerivFunction() 
        successes = 0
        for p1 in self.pList:
            angle1 = math.atan(p1.y)
            slope2 = derivFunc(p1.x)
            angle2 = math.atan(slope2)
            diffAngle = abs(angle1-angle2)
            if diffAngle > math.pi/2:
               diffAngle -= math.pi
            if abs(diffAngle) < self.angleCloseness:
                successes += 1
        if len(self.pList) == successes:
            return (1., None)
        else:
            return (float(successes)/len(self.pList), self.failMessage) 

 
class ConstantCriteria(Criteria):
    args = Criteria.args + [InputArg('constant',InputArg.FLOAT,None, True)]

    '''check that y values of graph have certain behavior in relation to a constant
    Required arguments: f'''
    def __init__(self, kwargs):
        self.constant = None
        self.domain = (-float('inf'),float('inf'))
        self.fraction = .9
        Criteria.__init__(self, kwargs)

    def isBad(self, yValue):
        '''Determine whether or not this yValue is considered bad'''
        raise NotImplementedError

    def grade(self, graphData):
        """Points must stay away from 0 to get a full grade. 
        Points which are (xmax-xmin)/20 away from zero get a failing grade"""
        mini, maxi = self.domain
        if mini < graphData.xmin: mini = graphData.xmin
        if maxi > graphData.xmax: maxi = graphData.xmax
        counter = 0
        for p in graphData.xyPoints:
            # within domain but too close to constant
            if p.x > mini and p.x < maxi and self.isBad(p.y):
                counter += 1
        total = (maxi-mini)*graphData.pixelWidth/(graphData.xmax-graphData.xmin)
        if float(counter)/total > (1-self.fraction):
            return (0., self.failMessage + str(counter) + ' ' + str(total))
        else:
            return (1., None)


class AvoidConstantCriteria(ConstantCriteria):
    args = ConstantCriteria.args + [InputArg('yRange', InputArg.FLOAT, None, True)]
    failMessage = 'Make sure your drawing avoids illegal areas'
    """Check that data doesn't get close to some constant
    Required arguments: constant"""
    def __init__(self, kwargs):
        """Domain argument looks like [min, max]"""
        self.yRange = None
        ConstantCriteria.__init__(self, kwargs)

    def isBad(self, yValue):
        return abs(yValue - self.constant) < self.yRange

class CloseToConstantCriteria(ConstantCriteria):
    args = ConstantCriteria.args + [InputArg('yRange', InputArg.FLOAT, None, True)]
    failMessage = "Didn't draw close to constant"
    """Check that data stays close to some constant
    Required arguments: constant"""
    def __init__(self, kwargs):
        """Domain argument looks like [min, max]"""
        self.yRange = None
        ConstantCriteria.__init__(self, kwargs)

    def isBad(self, yValue):
        return abs(yValue - self.constant) > self.yRange

class IsHorizontalCriteria(Criteria):
    failMessage = "Not horizontal in right area"
    args = Criteria.args + [InputArg('domain',InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction',InputArg.FLOAT,.8),
                            InputArg('yValue',InputArg.FLOAT,None),
                            InputArg('yRange',InputArg.FLOAT,None)]

    """Check that data is a horizontal line within domain."""
    def __init__(self, kwargs):
        self.domain = (-float('inf'), float('inf'))
        self.yValue = None
        self.yRange = None
        self.fraction = .95
        Criteria.__init__(self, kwargs)

    def grade(self, graphData):
        mini, maxi = self.domain
        if mini < graphData.xmin: mini = graphData.xmin
        if maxi > graphData.xmax: maxi = graphData.xmax
        pixelMin = graphData.indexFromXY(mini, 5)[0]
        pixelMax = graphData.indexFromXY(maxi, 5)[0]
        # Check that pixels fall within certain range (allowing for some fraction to be wrong)
        graphY = [p.y for p in graphData.xyPoints if p.x > mini and p.x < maxi]
        maxY = max(graphY)
        minY = min(graphY)
        if abs(maxY - minY) > self.yRange:
            return (0., self.failMessage)

        # average height should be at yvalue if provided
        if self.yValue != None:
            avg = float(sum(graphY))/len(graphY)
            if abs(avg - self.yValue) > self.yRange:
                return (0., self.failMessage)
        
        pDiffs = [p for p in graphData.getPixelDiff() if p.x > pixelMin and p.x < pixelMax]
        overallChange = sum([p.y for p in pDiffs])
        minSize = 40
        overallChange = sum([p.y for p in pDiffs[:minSize]])
        for i in range(minSize,len(pDiffs)):
            overallChange += pDiffs[i].y
            if abs(overallChange) > 10:
                return (0., self.failMessage)

        # square the pixel slope within a window. If sum of squares exceeds threshold,
        # return as bad
        # TODO: make it robust to empty spaces in between points
        windowSize = 40
        thresholdSum = 17
        if len(pDiffs) < windowSize:
            if sum([p.y**2 for p in pDiffs]) < thresholdSum:
                return (1., None)
            else:
                return (0., self.failMessage)
        else:
            windowSum = sum([p.y**2 for p in pDiffs[:windowSize]])
            for i in range(windowSize, len(pDiffs)):
                windowSum -= pDiffs[i-windowSize].y**2
                windowSum += pDiffs[i].y**2
                if windowSum > thresholdSum:
                    return (0., self.failMessage)
            return (1., None)                



class DomainUsedCriteria(Criteria):
    failMessage = 'You need to fill more of the domain of the graph'
    args = Criteria.args + [InputArg('domain',InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction',InputArg.FLOAT,.8)]
    """Make sure some percentage of the domain is actually drawn on"""
    def grade(self, graphData):
        mini, maxi = self.domain
        if mini < graphData.xmin: mini = graphData.xmin
        if maxi > graphData.xmax: maxi = graphData.xmax
        numPixelsInDom = graphData.pixelWidth*(float(maxi-mini)/(graphData.xmax-graphData.xmin))
        counter = 0
        for p in graphData.getFunctionList():
            if p.x > mini and p.x < maxi:
                counter += 1
        if counter > numPixelsInDom*self.fraction:
            return (1., None)
        else:
            return (0., self.failMessage)

class IsFunctionCriteria(Criteria):
    failMessage = "Your graph needs to be a function (one y value per x value)"
    args = Criteria.args + [InputArg('domain',InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction',InputArg.FLOAT,.8)]
    '''Check if graph is close to a function (one y value per x value)
    Or at least that repeat y values are close to each other indicating a vertical line'''
    def __init__(self, kwargs):
        self.domain = (-float('inf'), float('inf'))
        self.fraction = .95
        Criteria.__init__(self, kwargs)

    def grade(self, graphData):
        mini, maxi = self.domain
        if mini < graphData.xmin: mini = graphData.xmin
        if maxi > graphData.xmax: maxi = graphData.xmax
        iCount = [[] for i in range(graphData.pixelWidth)]
        pixelMin = graphData.indexFromXY(mini, 5)[0]
        pixelMax = graphData.indexFromXY(maxi, 5)[0]
        for bp in graphData.blackPixels:
            if bp.x > pixelMin and bp.x < pixelMax:
                iCount[bp.x].append(bp.y)
        total, illegal = 0, 0
        for c in iCount:
            if len(c) > 0: total += 1
            c.sort()
            for i in range(len(c)-1):
                if abs(c[i+1] - c[i]) > 2: # if not vertically adjacent, it's illegal
                    illegal += 1 
        illegalFraction = -1 if total == 0 else float(illegal)/total
        if illegalFraction > .05:
            return (0., self.failMessage)
        else:
            return (1., None)

class FunctionFollowedCriteria(Criteria):
    args = Criteria.args + [InputArg('domain',InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction',InputArg.FLOAT,.8),
                            InputArg('f',InputArg.FUNCTION, "", True),
                            InputArg('pixelCloseness', InputArg.INTEGER, 10)]

    failMessage = 'Did not match our function'
    """Check if graph follows function through domain specified
    Required arguments: f"""
    def __init__(self, kwargs):
        """f should take in one paramater, x, and output y"""
        f = kwargs['f']
        if type(f) != type(lambda x: x):
            f = eval("lambda x: " + f)
        kwargs['f'] = f
        self.pixelCloseness = 40
        self.domain = (-float('inf'), float('inf'))
        self.fraction = .9
        Criteria.__init__(self, kwargs)

    #maximum added score of 1
    def updatePossibleScores(self,stroke, state, possibleDict, otherVars):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        yCloseness = float(self.pixelCloseness)/(otherVars['pixelHeight']/(otherVars['ymax'] - otherVars['ymin']))
        for (i,j) in possibleDict:
            x = xmin + i*(xmax-xmin)/pixelWidth
            y = ymax - j*(ymax-ymin)/pixelHeight
            if x < self.domain[0] or x > self.domain[1]:
                possibleDict[(i,j)] += self.weight
            elif abs(self.f(x)-y) < yCloseness:
                possibleDict[(i,j)] += self.weight
        
    def grade(self, graphData):
        mini, maxi = self.domain
        if mini < graphData.xmin: mini = graphData.xmin
        if maxi > graphData.xmax: maxi = graphData.xmax
        pixelMin = graphData.indexFromXY(mini, 5)[0]
        pixelMax = graphData.indexFromXY(maxi, 5)[0]
        xPixelStep = float(graphData.xmax-graphData.xmin)/graphData.pixelWidth
        pixelAnswerI = {}
        pixelAnswerJ = {}
    
        for i in xrange(pixelMin, pixelMax+1):
            x = graphData.xyFromIndex(i,0)[0]
            y = self.f(x)
            ii, j = graphData.indexFromXY(x, y)
            # ii should be the same as i
            pixelAnswerI[ii] = util.Point(ii, j)
            pixelAnswerJ[j] = util.Point(ii, j)
        counter = 0
        bad = []
        loopCounter = 0
        for p in graphData.getGaussFunctionList():
            if p.x > mini and p.x < maxi:
                loopCounter += 1
                i, j = graphData.indexFromXY(p.x, p.y)
                if i in pixelAnswerI and abs(pixelAnswerI[i].y - j) < self.pixelCloseness:
                    continue
                elif j in pixelAnswerJ and abs(pixelAnswerJ[j].x - i) < self.pixelCloseness:
                    continue
                else:
                    bad.append((p.x,p.y))
                    counter += 1
        numPixelsInDom = pixelMax-pixelMin
        if counter > numPixelsInDom*(1-self.fraction):
            return (0., self.failMessage)
        else:
            return (1., counter)

    def requiredPolygons(self, otherVars):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        allPolys = []
        topEdge = []
        bottomEdge = []
        imin = int(max(0, (self.domain[0] - xmin)/float(xmax-xmin)*pixelWidth))
        imax = int(min(pixelWidth, (self.domain[1] - xmin)/float(xmax-xmin)*pixelWidth))
        for i in range(imin,imax):
            x = xmin + i*(xmax-xmin)/pixelWidth
            y = self.f(x)
            j = int((ymax - y)/float(ymax-ymin)*pixelHeight)
            # if green is within bounds
            if (j+self.pixelCloseness > 0 or j-self.pixelCloseness < pixelHeight):
                topEdge.append((i,max(0,min(j-self.pixelCloseness, pixelHeight))))
                bottomEdge.append((i,min(pixelHeight,max(j+self.pixelCloseness,0))))
            elif len(topEdge) > 0:
                topEdge.reverse()
                topEdge.extend(bottomEdge)
                allPolys.append(topEdge)
                topEdge = []
                bottomEdge = []
        if len(topEdge) > 0: 
            topEdge.reverse()
            topEdge.extend(bottomEdge)
            allPolys.append(topEdge)
        return allPolys

    def forbiddenPolygons(self, otherVars):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        allPolys = []
        topPoly = []
        bottomPoly = []
        imin = int(max(0, (self.domain[0] - xmin)/float(xmax-xmin)*pixelWidth))
        imax = int(min(pixelWidth, (self.domain[1] - xmin)/float(xmax-xmin)*pixelWidth))
        def finishPoly(l, edge):
            first = l[0]
            last = l[-1]
            l.append((last[0],edge))
            l.append((first[0],edge))
        for i in range(imin,imax):
            x = xmin + i*(xmax-xmin)/pixelWidth
            y = self.f(x)
            j = int((ymax - y)/float(ymax-ymin)*pixelHeight)
            # top
            if (j-self.pixelCloseness > 0):
                topPoly.append((i,min(j-self.pixelCloseness,pixelHeight)))
            elif len(topPoly) > 0:
                finishPoly(topPoly, 0)
                allPolys.append(topPoly)
                topPoly = []
            # bottom
            if (j+self.pixelCloseness < pixelHeight):
                bottomPoly.append((i,max(j+self.pixelCloseness, 0)))
            elif len(bottomPoly) > 0:
                finishPoly(bottomPoly, pixelHeight)
                allPolys.append(bottomPoly)
                bottomPoly = []
        if len(topPoly) > 0: 
            finishPoly(topPoly, 0)
            allPolys.append(topPoly)
        if len(bottomPoly) > 0: 
            finishPoly(bottomPoly, pixelHeight)
            allPolys.append(bottomPoly)
        return allPolys

    def requiredList(self, otherVars):
        yCloseness = float(self.pixelCloseness)/(otherVars['pixelHeight']/(otherVars['ymax'] - otherVars['ymin']))
        def acceptRequired(x,y):
            if x < self.domain[0] or x > self.domain[1]:
                return False
            return abs(self.f(x)-y) < yCloseness
        return self.filteredList(otherVars, acceptRequired)
    def forbiddenList(self, otherVars):
        yCloseness = float(self.pixelCloseness)/(otherVars['pixelHeight']/(otherVars['ymax'] - otherVars['ymin']))
        def acceptForbidden(x,y):
            if x < self.domain[0] or x > self.domain[1]:
                return False
            return abs(self.f(x)-y) > yCloseness
        return self.filteredList(otherVars, acceptForbidden)

'''import hashlib
user = ''
user = hashlib.sha224(user).hexdigest()
grader = createGraderFromProbID('parallelPower2')
gd = util.GraphData(dataFuncs.getStudentData(user, 'parallelPower1'))
print grader.grade(gd)'''

'''import hashlib
user = ''
user = hashlib.sha224(user).hexdigest()
grader = Grader()
grader.addCriteria(DomainUsedCriteria())
gd = util.GraphData(dataFuncs.getStudentData(user, 'parallelPower1'))
print grader.grade(gd)'''

'''cr = FunctionFollowedCriteria({"f":lambda x:x**2, "domain":[-1,1]})
otherVars = {"xmin":-2, "xmax":2, "ymin":-1, "ymax":1, "pixelWidth":60, "pixelHeight":40}
print cr.forbiddenPolygons(otherVars)'''
