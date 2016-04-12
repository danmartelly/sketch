import json
import graphUtil as util
import dataFuncs
import math

def createGrader(criteriaDictList):
    grader = Grader()
    for crit in criteriaDictList:
        t = crit['type']
        if (t[-8:] == "Criteria"):
            clazz = globals()[t]
        else:
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
    POINT = 9
    MULTIPLEPOINTS = 10
    mapping = {INTEGER:('integer',int),
        FLOAT:('float',float),
        STRING:('string',str),
        LIST:('list',list),
        CODE:('code',lambda x:x),
        BOOL:('boolean',bool),
        FUNCTION:('function',lambda x:x),
        SHAPE:('shape', lambda x:x),
        DOMAIN:('domain', lambda x:x),
        POINT:('point', lambda x:x),
        MULTIPLEPOINTS:('multiplePoints', lambda x:x)
    }
    def __init__(self, name, displayName, helpText, inputType, default, required=False):
        self.name = name
        self.displayName = displayName
        self.helpText = helpText
        self.inputType = inputType
        self.default = default
        self.required = required
    def getDict(self):
        d = {}
        d['name'] = self.name
        d['displayName'] = self.displayName
        d['helpText'] = self.helpText
        d['default'] = self.default
        d['type'] = InputArg.mapping[self.inputType][0] 
        d['required'] = self.required
        return d
    def processInput(self, val):
        return InputArg.mapping[self.inputType][1](val)

class Criteria():
    title = "Base Criteria Class Title (Update title variable)"
    helpText = ""
    args = [InputArg('weight', "Grade Weight: ", "What weight will this criteria have relative to others", InputArg.FLOAT, 1), 
            InputArg('failFast', "Fail Immediately: ", "When True, a student who does not pass this criteria instantly gets 0% as a grade", InputArg.BOOL, False)]
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
    # list of {'x':1, 'y':2, 'pixelRadius':5}
    def getCriticalPoints(self, otherVars):
        return []
    # list of {'x':1, 'y':2, 'slope':1, 'angleError':20} (angleError in degrees)
    def getSlopes(self, otherVars):
        return []
 
class MonotonicCriteria(Criteria):
    title = "Monotonicity Test Criteria"
    failMessage = 'Not monotonic'
    args = Criteria.args + [InputArg('domain', "Domain", "What range of x values this criteria will be checked on", InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('trend', "Trend", "1 means monotonically increasing, -1 means decreasing, 0 means either way", InputArg.INTEGER, 0, True),
                            InputArg('pixelCloseness', "Error margin (pixels)", "How far away in the wrong direction the student can go", InputArg.INTEGER, 10),
            InputArg('failMessage', "Message on failure: ", "The message returned to the student when they have not passed a criteria", InputArg.STRING, "Your drawing was not monotonic in the appropriate region")]

    """Check that data is monotonic. Can also specify whether a positive or
   negative trend is there"""
    def __init__(self, kwargs):
        """ trend = -1 --> must be negative trend
        trend = 0 --> doesn't matter if it's positive/negative, as long as its monotonic
        trend = 1 --> must be positive trend"""
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
    def isRelationshipPresent(self, otherVars):
        return True
    def relationshipRange(self, otherVars):
        print otherVars
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        return [max(self.domain[0], xmin), min(self.domain[1],xmax)]
    def relationshipIcon(self, otherVars):
        if self.trend == 1:
            return "up.jpg"
        elif self.trend == -1:
            return "down.jpg"
        else:
            return "updown.jpg"



class PointsCriteria(Criteria):
    title = "Critical Point Check"
    args = Criteria.args + [InputArg('pixelCloseness', "Precision (pixels)", "How close the drawing has to get to the specified point to get full credit", InputArg.INTEGER, 10),
                            InputArg('list', "Points", "", InputArg.MULTIPLEPOINTS,[],True),
            InputArg('failMessage', "Message on failure: ", "The message returned to the student when they have not passed a criteria", InputArg.STRING, "Your drawing didn't go through the critical points")]

    failMessage = 'Some critical points were missed'
    '''Check that the drawn graph contains this critical point within some range
    Required arguments: *list: which is a list of 2 length tuples containing (x,y)'''
    def __init__(self, kwargs):
        self.pointList = kwargs['list']
        kwargs['list'] = None
        if type(self.pointList) != type([]) and type(self.pointList) != type((0,)):
            self.pointList = eval(self.pointList)

        Criteria.__init__(self, kwargs)
    def grade(self, graphData):
        self.pList = []
        for p in self.pointList:
            self.pList.append(util.Point(p[0],p[1]))
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
    def getCriticalPoints(self, otherVars):
        ans = []
        for p in self.pointList:
            ans.append({'x':p[0], 'y':p[1], 'pixelRadius':self.pixelCloseness})
        return ans
        

class DerivativeCriteria(Criteria):
    title = "Derivative Check"
    args = Criteria.args + [InputArg('domain', "Domain", "For what x values you want to apply the criteria", InputArg.DOMAIN, [-float('inf'), float('inf')]),
                            InputArg('fraction', "Fraction Good", "What fraction of points drawn need to be inside the appropriate region", InputArg.FLOAT,.8),
                            InputArg('fprime', "Derivative in terms of x", "A function of the slope specified in terms of x specified with valid python syntax", InputArg.FUNCTION, "", True),
                            InputArg('angleCloseness', "Angle margin (degrees)", "How close the angle of the drawn slope has to be to the correct one", InputArg.FLOAT, 20),
            InputArg('failMessage', "Message on failure: ", "The message returned to the student when they have not passed a criteria", InputArg.STRING, "Your function did not match our derivative")]


    failMessage = 'The slope of your graph does not match the answer'
    '''Check that the derivative graph has an appropriate derivative at the given x values
    Required arguments: *list: which is a list of 2 length tuples containing (x, dy/dx)'''
    def __init__(self, kwargs):
        """f should take in one paramater, x, and output y"""
        f = kwargs['fprime']
        if type(f) != type(lambda x: x):
            f = eval("lambda x: " + f)
        kwargs['fprime'] = f
        Criteria.__init__(self, kwargs)
        
    def grade(self, graphData):
        derivList = [p for p in graphData.getSmoothDerivList() if p.x > self.domain[0] and p.x < self.domain[1]]
        xyperij = graphData.xyFromIndex(3,3)-graphData.xyFromIndex(2,2)
        successes = 0
        anglecloserad = self.angleCloseness*3.14159/180
        for p in derivList:
            drawnAngle = math.atan(p.y*xyperij[1]/xyperij[0])
            corrAngle = math.atan(self.fprime(p.x)*xyperij[1]/xyperij[0])
            diffAngle = abs(drawnAngle-corrAngle)
            if diffAngle > math.pi/2:
               diffAngle -= math.pi
            if abs(diffAngle) < anglecloserad:
                successes += 1
        if float(successes)/len(derivList) > self.fraction:
            return (1., None)
        else:
            return (0., self.failMessage) 

    def getSlopes(self, otherVars):
        horizontalDist = 40
        verticalDist = 40

        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        mini, maxi = self.domain
        if mini < xmin: mini = xmin
        if maxi > xmax: maxi = xmax
        imin = int(max(0, (self.domain[0] - xmin)/float(xmax-xmin)*pixelWidth))
        imax = int(min(pixelWidth, (self.domain[1] - xmin)/float(xmax-xmin)*pixelWidth))

        deg2rad = 3.14159/180
        drawList = []
        for i in range(imin, imax+1, horizontalDist):
            x = xmin + i*(xmax-xmin)/pixelWidth
            slope = self.fprime(x)
            for j in range(verticalDist/2, pixelHeight, verticalDist):
                y = ymax - (float(j)/pixelHeight)*(ymax-ymin)
                drawList.append({'x':x, 'y':y, 'slope':slope, 'angleError':self.angleCloseness*deg2rad})
        return drawList
       

class DomainUsedCriteria(Criteria):
    """Make sure some percentage of the domain is actually drawn on"""
    title = "Domain has been drawn in Check"
    failMessage = 'You need to fill more of the domain of the graph'
    args = Criteria.args + [InputArg('domain','Domain','What range of x values this criteria will be checked on',InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction','Fraction filled','Fraction of checked domain that should have something drawn in it', InputArg.FLOAT,.8),
            InputArg('failMessage', "Message on failure: ", "The message returned to the student when they have not passed a criteria", InputArg.STRING, "You didn't draw enough over the domain")]

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
    def isRelationshipPresent(self, otherVars):
        return True
    def relationshipRange(self, otherVars):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        return [max(self.domain[0], xmin), min(self.domain[1],xmax)]
    def relationshipIcon(self, otherVars):
        return "domainUsed.png"

class IsFunctionCriteria(Criteria):
    title = "Graph is a Function Check"
    failMessage = "Your graph needs to be a function (one y value per x value)"
    args = Criteria.args + [InputArg('domain', "Domain", "What range of x values the drawing needs to be a function in", InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction', "Fraction of good", "What fraction of the points drawn need to follow the rule", InputArg.FLOAT,.8),
            InputArg('failMessage', "Message on failure: ", "The message returned to the student when they have not passed a criteria", InputArg.STRING, "Your drawing should represent a function (only one y value for every x value")]

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
    def isRelationshipPresent(self, otherVars):
        return True
    def relationshipRange(self, otherVars):
        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)
        return [max(self.domain[0], xmin), min(self.domain[1],xmax)]
    def relationshipIcon(self, otherVars):
        return "isFunction.png"


class FunctionFollowedCriteria(Criteria):
    title = "Stick to Function Check"
    args = Criteria.args + [InputArg('domain', "Domain", "For what x values you want to apply the criteria", InputArg.DOMAIN,[-float('inf'), float('inf')]),
                            InputArg('fraction', "Fraction Good", "What fraction of points drawn need to be inside the appropriate region", InputArg.FLOAT,.8),
                            InputArg('f', "Function", "A function in terms of x specified with valid Python syntax", InputArg.FUNCTION, "", True),
                            InputArg('pixelCloseness', "Error margin (pixels):", "How close the drawing has to be to the correct answer", InputArg.INTEGER, 10),
            InputArg('failMessage', "Message on failure: ", "The message returned to the student when they have not passed a criteria", InputArg.STRING, "Your drawing didn't match our function")]


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
        highEdge = []
        lowEdge = []
        imin = int(max(0, (self.domain[0] - xmin)/float(xmax-xmin)*pixelWidth))
        imax = int(min(pixelWidth, (self.domain[1] - xmin)/float(xmax-xmin)*pixelWidth))
        for i in range(imin-self.pixelCloseness,imax+self.pixelCloseness):
            x = xmin + i*(xmax-xmin)/pixelWidth
            xprev = xmin + (i-1)*(xmax-xmin)/pixelWidth
            y = self.f(x)
            yprev = self.f(xprev)
            j = (ymax - y)/float(ymax-ymin)*pixelHeight
            jprev = (ymax-yprev)/float(ymax-ymin)*pixelHeight
            perpSlope = (-float(j-jprev), 1.)
            mag = (perpSlope[0]**2 + perpSlope[1]**2)**.5
            highi = round(i + perpSlope[0]*self.pixelCloseness/mag)
            highj = round(j + perpSlope[1]*self.pixelCloseness/mag)
            lowi = round(i - perpSlope[0]*self.pixelCloseness/mag)
            lowj = round(j - perpSlope[1]*self.pixelCloseness/mag)
            # add to edges if possible
            if (highj > 0 or lowj < pixelHeight):
                if highi >= imin and highi <= imax and highj > 0:
                    highEdge.append((highi,max(0,min(highj, pixelHeight))))
                if lowi >= imin and lowi <= imax and lowj < pixelHeight:
                    lowEdge.append((lowi,min(pixelHeight,max(lowj,0))))
            elif len(highEdge) > 0:
                highEdge.reverse()
                highEdge.extend(lowEdge)
                allPolys.append(highEdge)
                highEdge = []
                lowEdge = []

        if len(highEdge) > 0: 
            highEdge.reverse()
            highEdge.extend(lowEdge)
            allPolys.append(highEdge)
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
        for i in range(imin-self.pixelCloseness,imax+self.pixelCloseness):
            x = xmin + i*(xmax-xmin)/pixelWidth
            xprev = xmin + (i-1)*(xmax-xmin)/pixelWidth
            y = self.f(x)
            yprev = self.f(xprev)
            j = (ymax - y)/float(ymax-ymin)*pixelHeight
            jprev = (ymax-yprev)/float(ymax-ymin)*pixelHeight
            perpSlope = (-float(j-jprev), 1.)
            mag = (perpSlope[0]**2 + perpSlope[1]**2)**.5
            highi = round(i + perpSlope[0]*self.pixelCloseness/mag)
            highj = round(j + perpSlope[1]*self.pixelCloseness/mag)
            lowi = round(i - perpSlope[0]*self.pixelCloseness/mag)
            lowj = round(j - perpSlope[1]*self.pixelCloseness/mag)
            # top
            if (lowi >= imin and lowi <= imax and lowj > 0):
                topPoly.append((lowi,min(lowj,pixelHeight)))
            elif len(topPoly) > 0:
                finishPoly(topPoly, 0)
                allPolys.append(topPoly)
                topPoly = []
            # bottom
            if (highi >= imin and highi <= imax and highj < pixelHeight):
                bottomPoly.append((highi,max(highj, 0)))
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
