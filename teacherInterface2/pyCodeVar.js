criteriaCode = {"MonotonicCriteria": "class MonotonicCriteria(Criteria):\n    failMessage = \'Not monotonic\'\n    args = Criteria.args + [InputArg(\'domain\',InputArg.DOMAIN,[-float(\'inf\'), float(\'inf\')]),\n                            InputArg(\'trend\', InputArg.INTEGER, 0, True),\n                            InputArg(\'pixelCloseness\', InputArg.INTEGER, 10)]\n    \"\"\"Check that data is monotonic. Can also specify whether a positive or\n   negative trend is there\"\"\"\n    def __init__(self, kwargs):\n        \"\"\" trend = -1 --> must be negative trend\n        trend = 0 --> doesn\'t matter if it\'s positive/negative, as long as its monotonic\n        trend = 1 --> must be positive trend\"\"\"\n        self.trend = 0\n        self.pixelCloseness = 10\n        self.domain = (-float(\'inf\'), float(\'inf\'))\n        Criteria.__init__(self, kwargs)\n\n    def grade(self, graphData):\n        mini, maxi = self.domain\n        if mini < graphData.xmin: mini = graphData.xmin\n        if maxi > graphData.xmax: maxi = graphData.xmax\n        pixelMin = graphData.indexFromXY(mini, 5)[0]\n        pixelMax = graphData.indexFromXY(maxi, 5)[0]\n        if self.trend == 1 or self.trend == -1:\n            windowSize = 40\n            diffs = [p for p in graphData.getPixelDiff() if p.x > pixelMin and p.x < pixelMax]\n            vals = [p for p in graphData.getFunctionList() if p.x > mini and p.x < maxi]\n            if len(diffs) < windowSize:\n                if self.trend*sum([p.y for p in diffs]) < 0:\n                    return (0., self.failMessage + \'1\')\n                else:\n                    return (1., None)\n            else:\n                windowSum = sum([p.y for p in diffs[:windowSize]])\n                maxPixelDiff = 5\n                for i in range(windowSize, len(diffs)):\n                    windowSum -= diffs[i-windowSize].y\n                    windowSum += diffs[i].y\n                    if -self.trend*windowSum < -maxPixelDiff:\n                        return (0., self.failMessage + \'2 \' + str(self.trend) + str(windowSum))\n                biggest = -float(\'inf\')\n                for p in vals:\n                    if self.trend*p.y > biggest:\n                        biggest = self.trend*p.y\n                    else:\n                        diff = biggest - self.trend*p.y\n                        pixelDistance = graphData.indexFromXY(0,diff)[1] - graphData.indexFromXY(0,0)[1]\n                        if pixelDistance > self.pixelCloseness:\n                            return (0., self.failMessage + \'3 \' + str(self.trend)  + str(pixelDistance) + \' \' + str(biggest) )\n                return (1., None)\n        else:\n            self.trend = 1\n            score1 = self.grade(graphData)\n            self.trend = -1\n            score2 = self.grade(graphData)\n            self.trend = 0\n            score = max(score1,score2,key=lambda x:x[0])\n            return score\n    def updatePossibleScores(self, stroke, state, possibleDict, otherVars):\n        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)\n        prevj = pixelHeight\n        if len(stroke) > 0:\n            prevj = stroke[-1][1]\n        prevy = ymax - prevj*(ymax-ymin)/pixelHeight\n        if state == None: state = prevj\n        elif trend == 1: state = min(state, prevj)\n        elif trend == -1: state = max(state, prevj)\n        for (i, j) in possibleDict:\n            x = xmin + i*(xmax-xmin)/pixelWidth\n            y = ymax - j*(ymax-ymin)/pixelHeight\n            if x < self.domain[0] or x > self.domain[1]:\n                possibleDict[(i,j)] += self.weight\n            elif self.trend == 1:\n                multiplier = max(min(1 + float(state-j)/self.pixelCloseness, 1), 0)\n                possibleDict[(i,j)] += self.weight*multiplier\n            elif self.trend == -1:\n                multiplier = max(min(1 + float(j-state)/self.pixelCloseness, 1), 0)\n                possibleDict[(i,j)] += self.weight*multiplier\n\n            # TODO: deal with trend = 0\n    def isRelationshipPresent(self, otherVars):\n        return True\n    def relationshipRange(self, otherVars):\n        return self.domain\n    def relationshipIcon(self, otherVars):\n        if self.trend == 1:\n            return \"up.jpg\"\n        elif self.trend == -1:\n            return \"down.jpg\"\n        else:\n            return \"updown.jpg\"\n",
"ConstantCriteria": "class ConstantCriteria(Criteria):\n    args = Criteria.args + [InputArg(\'constant\',InputArg.FLOAT,None, True)]\n\n    \'\'\'check that y values of graph have certain behavior in relation to a constant\n    Required arguments: f\'\'\'\n    def __init__(self, kwargs):\n        self.constant = None\n        self.domain = (-float(\'inf\'),float(\'inf\'))\n        self.fraction = .9\n        Criteria.__init__(self, kwargs)\n\n    def isBad(self, yValue):\n        \'\'\'Determine whether or not this yValue is considered bad\'\'\'\n        raise NotImplementedError\n\n    def grade(self, graphData):\n        \"\"\"Points must stay away from 0 to get a full grade. \n        Points which are (xmax-xmin)/20 away from zero get a failing grade\"\"\"\n        mini, maxi = self.domain\n        if mini < graphData.xmin: mini = graphData.xmin\n        if maxi > graphData.xmax: maxi = graphData.xmax\n        counter = 0\n        for p in graphData.xyPoints:\n            # within domain but too close to constant\n            if p.x > mini and p.x < maxi and self.isBad(p.y):\n                counter += 1\n        total = (maxi-mini)*graphData.pixelWidth/(graphData.xmax-graphData.xmin)\n        if float(counter)/total > (1-self.fraction):\n            return (0., self.failMessage + str(counter) + \' \' + str(total))\n        else:\n            return (1., None)\n",
"AvoidRegionCriteria": "class AvoidRegionCriteria(Criteria):\n    failMessage = 'Drawing on region which should be avoided'\n    args = Criteria.args + [InputArg('shape',InputArg.SHAPE,None),\n                            InputArg('fraction',InputArg.FLOAT, .95)]\n    '''Check whether or not passed in shape has points\n    Required arguments: *shape'''\n    def __init__(self, kwargs):\n        self.shape = Rectangle(kwargs['shape'])\n        kwargs['shape'] = None\n        self.fraction = .95\n        Criteria.__init__(self, kwargs)\n    def grade(self, graphData):\n        bad = 0\n        for p in graphData.xyPoints:\n            if self.shape.withinShape(p):\n                bad += 1\n        badFraction = bad/float(len(graphData.xyPoints))\n        if badFraction > 1-self.fraction:\n            return (0., self.failMessage)\n        else:\n            return (1., None)\n",
"PointsCriteria": "class PointsCriteria(Criteria):\n    args = Criteria.args + [InputArg('list',InputArg.MULTIPLEPOINTS,[],True)]\n    failMessage = 'Some critical points were missed'\n    '''Check that the drawn graph contains this critical point within some range\n    Required arguments: *list: which is a list of 2 length tuples containing (x,y)'''\n    def __init__(self, kwargs):\n        pointList = kwargs['list']\n        kwargs['list'] = None\n        self.pList = []\n        if type(pointList) != type([]) and type(pointList) != type((0,)):\n            pointList = eval(pointList)\n        for p in pointList:\n            self.pList.append(util.Point(p[0],p[1]))\n        self.pixelCloseness = 10\n        Criteria.__init__(self, kwargs)\n    def grade(self, graphData):\n        copyList = self.pList[:]\n        for p1Indices in graphData.blackPixels:\n            for i in range(len(copyList)-1,-1,-1):\n                p2Indices = graphData.indexFromXY(copyList[i].x, copyList[i].y)\n                if p1Indices.close(p2Indices, self.pixelCloseness):\n                    copyList.pop(i)\n                    continue\n            if len(copyList) == 0: break\n        if len(copyList) == 0:\n            return (1., None)\n        else:\n            return (0., self.failMessage + str(copyList) + 'missed')\n",
"AvoidConstantCriteria": "class AvoidConstantCriteria(ConstantCriteria):\n    args = ConstantCriteria.args + [InputArg(\'yRange\', InputArg.FLOAT, None, True)]\n    failMessage = \'Make sure your drawing avoids illegal areas\'\n    \"\"\"Check that data doesn\'t get close to some constant\n    Required arguments: constant\"\"\"\n    def __init__(self, kwargs):\n        \"\"\"Domain argument looks like [min, max]\"\"\"\n        self.yRange = None\n        ConstantCriteria.__init__(self, kwargs)\n\n    def isBad(self, yValue):\n        return abs(yValue - self.constant) < self.yRange\n",
"CloseToConstantCriteria": "class CloseToConstantCriteria(ConstantCriteria):\n    args = ConstantCriteria.args + [InputArg(\'yRange\', InputArg.FLOAT, None, True)]\n    failMessage = \"Didn\'t draw close to constant\"\n    \"\"\"Check that data stays close to some constant\n    Required arguments: constant\"\"\"\n    def __init__(self, kwargs):\n        \"\"\"Domain argument looks like [min, max]\"\"\"\n        self.yRange = None\n        ConstantCriteria.__init__(self, kwargs)\n\n    def isBad(self, yValue):\n        return abs(yValue - self.constant) > self.yRange\n",
"DomainUsedCriteria": "class DomainUsedCriteria(Criteria):\n    failMessage = \'You need to fill more of the domain of the graph\'\n    args = Criteria.args + [InputArg(\'domain\',InputArg.DOMAIN,[-float(\'inf\'), float(\'inf\')]),\n                            InputArg(\'fraction\',InputArg.FLOAT,.8)]\n    \"\"\"Make sure some percentage of the domain is actually drawn on\"\"\"\n    def grade(self, graphData):\n        mini, maxi = self.domain\n        if mini < graphData.xmin: mini = graphData.xmin\n        if maxi > graphData.xmax: maxi = graphData.xmax\n        numPixelsInDom = graphData.pixelWidth*(float(maxi-mini)/(graphData.xmax-graphData.xmin))\n        counter = 0\n        for p in graphData.getFunctionList():\n            if p.x > mini and p.x < maxi:\n                counter += 1\n        if counter > numPixelsInDom*self.fraction:\n            return (1., None)\n        else:\n            return (0., self.failMessage)\n",
"InputArg": "class InputArg():\n    INTEGER = 0\n    FLOAT = 1\n    BOOL = 2\n    STRING = 3\n    LIST = 4\n    CODE = 5\n    FUNCTION = 6\n    SHAPE = 7\n    DOMAIN = 8\n    POINT = 9\n    MULTIPLEPOINTS = 10\n    mapping = {INTEGER:('integer',int),\n        FLOAT:('float',float),\n        STRING:('string',str),\n        LIST:('list',list),\n        CODE:('code',lambda x:x),\n        BOOL:('boolean',bool),\n        FUNCTION:('function',lambda x:x),\n        SHAPE:('shape', lambda x:x),\n        DOMAIN:('domain', lambda x:x),\n        POINT:('point', lambda x:x),\n        MULTIPLEPOINTS:('multiplePoints', lambda x:x)\n    }\n    def __init__(self, name, inputType, default, required=False):\n        self.name = name\n        self.inputType = inputType\n        self.default = default\n        self.required = required\n    def getDict(self):\n        d = {}\n        d['name'] = self.name\n        d['default'] = self.default\n        d['type'] = InputArg.mapping[self.inputType][0] \n        d['required'] = self.required\n        return d\n    def processInput(self, val):\n        return InputArg.mapping[self.inputType][1](val)\n",
"DerivativeCriteria": "class DerivativeCriteria(Criteria):\n    args = Criteria.args + [InputArg('list',InputArg.LIST,[],True)]\n    failMessage = 'The slope of your graph at some important points doesn\\' match the answer'\n    '''Check that the derivative graph has an appropriate derivative at the given x values\n    Required arguments: *list: which is a list of 2 length tuples containing (x, dy/dx)'''\n    def __init__(self, kwargs):\n        derivList = kwargs['list']\n        kwargs['list'] = None\n        self.pList = []\n        if type(derivList) != type([]) or type(derivList) != type((0,)):\n            derivList = eval(derivList)\n        for p in derivList:\n            self.pList.append(util.Point(p[0],p[1]))\n        self.angleCloseness = math.pi/7.\n        Criteria.__init__(self, kwargs)\n        \n    def grade(self, graphData):\n        derivFunc = graphData.getSmoothDerivFunction() \n        successes = 0\n        for p1 in self.pList:\n            angle1 = math.atan(p1.y)\n            slope2 = derivFunc(p1.x)\n            angle2 = math.atan(slope2)\n            diffAngle = abs(angle1-angle2)\n            if diffAngle > math.pi/2:\n               diffAngle -= math.pi\n            if abs(diffAngle) < self.angleCloseness:\n                successes += 1\n        if len(self.pList) == successes:\n            return (1., None)\n        else:\n            return (float(successes)/len(self.pList), self.failMessage) \n",
"IsHorizontalCriteria": "class IsHorizontalCriteria(Criteria):\n    failMessage = \"Not horizontal in right area\"\n    args = Criteria.args + [InputArg(\'domain\',InputArg.DOMAIN,[-float(\'inf\'), float(\'inf\')]),\n                            InputArg(\'fraction\',InputArg.FLOAT,.8),\n                            InputArg(\'yValue\',InputArg.FLOAT,None),\n                            InputArg(\'yRange\',InputArg.FLOAT,None)]\n\n    \"\"\"Check that data is a horizontal line within domain.\"\"\"\n    def __init__(self, kwargs):\n        self.domain = (-float(\'inf\'), float(\'inf\'))\n        self.yValue = None\n        self.yRange = None\n        self.fraction = .95\n        Criteria.__init__(self, kwargs)\n\n    def grade(self, graphData):\n        mini, maxi = self.domain\n        if mini < graphData.xmin: mini = graphData.xmin\n        if maxi > graphData.xmax: maxi = graphData.xmax\n        pixelMin = graphData.indexFromXY(mini, 5)[0]\n        pixelMax = graphData.indexFromXY(maxi, 5)[0]\n        # Check that pixels fall within certain range (allowing for some fraction to be wrong)\n        graphY = [p.y for p in graphData.xyPoints if p.x > mini and p.x < maxi]\n        maxY = max(graphY)\n        minY = min(graphY)\n        if abs(maxY - minY) > self.yRange:\n            return (0., self.failMessage)\n\n        # average height should be at yvalue if provided\n        if self.yValue != None:\n            avg = float(sum(graphY))/len(graphY)\n            if abs(avg - self.yValue) > self.yRange:\n                return (0., self.failMessage)\n        \n        pDiffs = [p for p in graphData.getPixelDiff() if p.x > pixelMin and p.x < pixelMax]\n        overallChange = sum([p.y for p in pDiffs])\n        minSize = 40\n        overallChange = sum([p.y for p in pDiffs[:minSize]])\n        for i in range(minSize,len(pDiffs)):\n            overallChange += pDiffs[i].y\n            if abs(overallChange) > 10:\n                return (0., self.failMessage)\n\n        # square the pixel slope within a window. If sum of squares exceeds threshold,\n        # return as bad\n        # TODO: make it robust to empty spaces in between points\n        windowSize = 40\n        thresholdSum = 17\n        if len(pDiffs) < windowSize:\n            if sum([p.y**2 for p in pDiffs]) < thresholdSum:\n                return (1., None)\n            else:\n                return (0., self.failMessage)\n        else:\n            windowSum = sum([p.y**2 for p in pDiffs[:windowSize]])\n            for i in range(windowSize, len(pDiffs)):\n                windowSum -= pDiffs[i-windowSize].y**2\n                windowSum += pDiffs[i].y**2\n                if windowSum > thresholdSum:\n                    return (0., self.failMessage)\n            return (1., None)                \n",
"Criteria": "class Criteria():\n    args = [InputArg(\'weight\',InputArg.FLOAT, 1), \n            InputArg(\'failFast\', InputArg.BOOL, False)]\n    failMessage = \'Criteria failed in some way\'\n    def __init__(self, kwargs):\n        missingArgs = []\n        unusedArgs = []\n        for inp in self.args:\n            if inp.name in kwargs:\n                setattr(self, inp.name, inp.processInput(kwargs.pop(inp.name)))\n            elif inp.required:\n                missingArgs.append(inp.name)\n            else:\n                setattr(self, inp.name, inp.default)\n        for k in kwargs:\n            unusedArgs.append(k)\n        error = \"\"\n        if len(missingArgs) > 0:\n            error += \'Missing arguments: \' + str(missingArgs) + \"\\n\"\n        if len(unusedArgs) > 0:\n            error += \"Extra unused arguments: \" + str(unusedArgs) + \"\\n\"\n        if error != \"\":\n            raise Exception(str(self.__class__) + error)\n    # returns grade performance between 0 and 1, and feedback string\n    # e.g. .5 means 50%, (.5, \'not all critical points hit\')\n    def grade(self, graphData):\n        raise NotImplementedError\n    # otherVars is a dictionary containing xmin, xmax, ymin, ymax, pixelWidth, pixelHeight\n    def unpackOtherVars(self, otherVars):\n        xmin = otherVars[\'xmin\']\n        xmax = otherVars[\'xmax\']\n        ymin = otherVars[\'ymin\']\n        ymax = otherVars[\'ymax\']\n        pixelWidth = otherVars[\'pixelWidth\']\n        pixelHeight = otherVars[\'pixelHeight\']\n        return (xmin, xmax, ymin, ymax, int(pixelWidth), int(pixelHeight))\n    def filteredList(self, otherVars, boolFuncXY):\n        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)\n        answer = []\n        for i in range(pixelWidth):\n            x = xmin + i*(xmax-xmin)/pixelWidth\n            for j in range(pixelHeight):\n                y = ymax - j*(ymax-ymin)/pixelHeight\n                if boolFuncXY(x,y):\n                    answer.append((i,j))\n        return answer\n    def updatePossibleScores(self,stroke, state, possibleDict, otherVars):\n        pass\n    def requiredPolygons(self, otherVars):\n        return None\n    def forbiddenPolygons(self, otherVars):\n        return None\n    def requiredList(self, otherVars):\n        # suggestion: make use of filteredList for other code\n        return []\n    def forbiddenList(self,otherVars):\n        # suggestion: make use of filteredList for other code\n        return []\n    def isRelationshipPresent(self, otherVars):\n        return False\n    def relationshipRange(self, otherVars):\n        return [0,0]\n    def relationshipIcon(self, otherVars):\n        return None\n    def getCriticalPoints(self, otherVars):\n        return []\n",
"FunctionFollowedCriteria": "class FunctionFollowedCriteria(Criteria):\n    args = Criteria.args + [InputArg(\'domain\',InputArg.DOMAIN,[-float(\'inf\'), float(\'inf\')]),\n                            InputArg(\'fraction\',InputArg.FLOAT,.8),\n                            InputArg(\'f\',InputArg.FUNCTION, \"\", True),\n                            InputArg(\'pixelCloseness\', InputArg.INTEGER, 10)]\n\n    failMessage = \'Did not match our function\'\n    \"\"\"Check if graph follows function through domain specified\n    Required arguments: f\"\"\"\n    def __init__(self, kwargs):\n        \"\"\"f should take in one paramater, x, and output y\"\"\"\n        f = kwargs[\'f\']\n        if type(f) != type(lambda x: x):\n            f = eval(\"lambda x: \" + f)\n        kwargs[\'f\'] = f\n        self.pixelCloseness = 40\n        self.domain = (-float(\'inf\'), float(\'inf\'))\n        self.fraction = .9\n        Criteria.__init__(self, kwargs)\n\n    #maximum added score of 1\n    def updatePossibleScores(self,stroke, state, possibleDict, otherVars):\n        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)\n        yCloseness = float(self.pixelCloseness)/(otherVars[\'pixelHeight\']/(otherVars[\'ymax\'] - otherVars[\'ymin\']))\n        for (i,j) in possibleDict:\n            x = xmin + i*(xmax-xmin)/pixelWidth\n            y = ymax - j*(ymax-ymin)/pixelHeight\n            if x < self.domain[0] or x > self.domain[1]:\n                possibleDict[(i,j)] += self.weight\n            elif abs(self.f(x)-y) < yCloseness:\n                possibleDict[(i,j)] += self.weight\n        \n    def grade(self, graphData):\n        mini, maxi = self.domain\n        if mini < graphData.xmin: mini = graphData.xmin\n        if maxi > graphData.xmax: maxi = graphData.xmax\n        pixelMin = graphData.indexFromXY(mini, 5)[0]\n        pixelMax = graphData.indexFromXY(maxi, 5)[0]\n        xPixelStep = float(graphData.xmax-graphData.xmin)/graphData.pixelWidth\n        pixelAnswerI = {}\n        pixelAnswerJ = {}\n    \n        for i in xrange(pixelMin, pixelMax+1):\n            x = graphData.xyFromIndex(i,0)[0]\n            y = self.f(x)\n            ii, j = graphData.indexFromXY(x, y)\n            # ii should be the same as i\n            pixelAnswerI[ii] = util.Point(ii, j)\n            pixelAnswerJ[j] = util.Point(ii, j)\n        counter = 0\n        bad = []\n        loopCounter = 0\n        for p in graphData.getGaussFunctionList():\n            if p.x > mini and p.x < maxi:\n                loopCounter += 1\n                i, j = graphData.indexFromXY(p.x, p.y)\n                if i in pixelAnswerI and abs(pixelAnswerI[i].y - j) < self.pixelCloseness:\n                    continue\n                elif j in pixelAnswerJ and abs(pixelAnswerJ[j].x - i) < self.pixelCloseness:\n                    continue\n                else:\n                    bad.append((p.x,p.y))\n                    counter += 1\n        numPixelsInDom = pixelMax-pixelMin\n        if counter > numPixelsInDom*(1-self.fraction):\n            return (0., self.failMessage)\n        else:\n            return (1., counter)\n\n    def requiredPolygons(self, otherVars):\n        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)\n        allPolys = []\n        topEdge = []\n        bottomEdge = []\n        imin = int(max(0, (self.domain[0] - xmin)/float(xmax-xmin)*pixelWidth))\n        imax = int(min(pixelWidth, (self.domain[1] - xmin)/float(xmax-xmin)*pixelWidth))\n        for i in range(imin,imax):\n            x = xmin + i*(xmax-xmin)/pixelWidth\n            y = self.f(x)\n            j = int((ymax - y)/float(ymax-ymin)*pixelHeight)\n            # if green is within bounds\n            if (j+self.pixelCloseness > 0 or j-self.pixelCloseness < pixelHeight):\n                topEdge.append((i,max(0,min(j-self.pixelCloseness, pixelHeight))))\n                bottomEdge.append((i,min(pixelHeight,max(j+self.pixelCloseness,0))))\n            elif len(topEdge) > 0:\n                topEdge.reverse()\n                topEdge.extend(bottomEdge)\n                allPolys.append(topEdge)\n                topEdge = []\n                bottomEdge = []\n        if len(topEdge) > 0: \n            topEdge.reverse()\n            topEdge.extend(bottomEdge)\n            allPolys.append(topEdge)\n        return allPolys\n\n    def forbiddenPolygons(self, otherVars):\n        (xmin, xmax, ymin, ymax, pixelWidth, pixelHeight) = self.unpackOtherVars(otherVars)\n        allPolys = []\n        topPoly = []\n        bottomPoly = []\n        imin = int(max(0, (self.domain[0] - xmin)/float(xmax-xmin)*pixelWidth))\n        imax = int(min(pixelWidth, (self.domain[1] - xmin)/float(xmax-xmin)*pixelWidth))\n        def finishPoly(l, edge):\n            first = l[0]\n            last = l[-1]\n            l.append((last[0],edge))\n            l.append((first[0],edge))\n        for i in range(imin,imax):\n            x = xmin + i*(xmax-xmin)/pixelWidth\n            y = self.f(x)\n            j = int((ymax - y)/float(ymax-ymin)*pixelHeight)\n            # top\n            if (j-self.pixelCloseness > 0):\n                topPoly.append((i,min(j-self.pixelCloseness,pixelHeight)))\n            elif len(topPoly) > 0:\n                finishPoly(topPoly, 0)\n                allPolys.append(topPoly)\n                topPoly = []\n            # bottom\n            if (j+self.pixelCloseness < pixelHeight):\n                bottomPoly.append((i,max(j+self.pixelCloseness, 0)))\n            elif len(bottomPoly) > 0:\n                finishPoly(bottomPoly, pixelHeight)\n                allPolys.append(bottomPoly)\n                bottomPoly = []\n        if len(topPoly) > 0: \n            finishPoly(topPoly, 0)\n            allPolys.append(topPoly)\n        if len(bottomPoly) > 0: \n            finishPoly(bottomPoly, pixelHeight)\n            allPolys.append(bottomPoly)\n        return allPolys\n\n    def requiredList(self, otherVars):\n        yCloseness = float(self.pixelCloseness)/(otherVars[\'pixelHeight\']/(otherVars[\'ymax\'] - otherVars[\'ymin\']))\n        def acceptRequired(x,y):\n            if x < self.domain[0] or x > self.domain[1]:\n                return False\n            return abs(self.f(x)-y) < yCloseness\n        return self.filteredList(otherVars, acceptRequired)\n    def forbiddenList(self, otherVars):\n        yCloseness = float(self.pixelCloseness)/(otherVars[\'pixelHeight\']/(otherVars[\'ymax\'] - otherVars[\'ymin\']))\n        def acceptForbidden(x,y):\n            if x < self.domain[0] or x > self.domain[1]:\n                return False\n            return abs(self.f(x)-y) > yCloseness\n        return self.filteredList(otherVars, acceptForbidden)\n",
"IsFunctionCriteria": "class IsFunctionCriteria(Criteria):\n    failMessage = \"Your graph needs to be a function (one y value per x value)\"\n    args = Criteria.args + [InputArg(\'domain\',InputArg.DOMAIN,[-float(\'inf\'), float(\'inf\')]),\n                            InputArg(\'fraction\',InputArg.FLOAT,.8)]\n    \'\'\'Check if graph is close to a function (one y value per x value)\n    Or at least that repeat y values are close to each other indicating a vertical line\'\'\'\n    def __init__(self, kwargs):\n        self.domain = (-float(\'inf\'), float(\'inf\'))\n        self.fraction = .95\n        Criteria.__init__(self, kwargs)\n\n    def grade(self, graphData):\n        mini, maxi = self.domain\n        if mini < graphData.xmin: mini = graphData.xmin\n        if maxi > graphData.xmax: maxi = graphData.xmax\n        iCount = [[] for i in range(graphData.pixelWidth)]\n        pixelMin = graphData.indexFromXY(mini, 5)[0]\n        pixelMax = graphData.indexFromXY(maxi, 5)[0]\n        for bp in graphData.blackPixels:\n            if bp.x > pixelMin and bp.x < pixelMax:\n                iCount[bp.x].append(bp.y)\n        total, illegal = 0, 0\n        for c in iCount:\n            if len(c) > 0: total += 1\n            c.sort()\n            for i in range(len(c)-1):\n                if abs(c[i+1] - c[i]) > 2: # if not vertically adjacent, it\'s illegal\n                    illegal += 1 \n        illegalFraction = -1 if total == 0 else float(illegal)/total\n        if illegalFraction > .05:\n            return (0., self.failMessage)\n        else:\n            return (1., None)\n",
"RegionFilledCriteria": "class RegionFilledCriteria(Criteria):\n    args = Criteria.args + [InputArg('shape',InputArg.SHAPE,None),\n                            InputArg('fraction',InputArg.FLOAT, .95)]\n\n    failMessage = 'Did not draw in appropriate region'\n    '''Check whether or not passed in shape has points\n    Required arguments: *shape\n    *mode = 'x' | 'y' '''\n    def __init__(self, kwargs):\n        self.shape = Rectangle(kwargs['shape'])\n        kwargs['shape'] = None\n        self.fraction = .9\n        self.mode = 'x'\n        Criteria.__init__(self, kwargs)\n\n    def grade(self, graphData):\n        usedIndices = {} # key would be i index if 'x' mode and j index if 'y' mode\n        for p in graphData.xyPoints:\n            if self.shape.withinShape(p):\n                i, j = graphData.indexFromXY(p.x, p.y)\n                if self.mode == 'x':\n                    usedIndices[i] = True\n                elif self.mode == 'y':\n                    usedIndices[j] = True\n        XYsize = self.shape.sizeInMode(self.mode)\n        if self.mode == 'x':\n            pixelSize = XYsize * graphData.pixelWidth / (graphData.xmax - graphData.xmin)\n        elif self.mode == 'y':\n            pixelSize = XYsize * graphData.pixelHeight / (graphData.ymax - graphData.ymin)\n        if len(usedIndices)/float(pixelSize) > self.fraction:\n            return (1., None)\n        else:\n            return (0., self.failMessage)\n"};
criteriaInputs = {"MonotonicCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [-Infinity, Infinity], "required": false, "type": "domain", "name": "domain"}, {"default": 0, "required": true, "type": "integer", "name": "trend"}, {"default": 10, "required": false, "type": "integer", "name": "pixelCloseness"}], "CloseToConstantCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": null, "required": true, "type": "float", "name": "constant"}, {"default": null, "required": true, "type": "float", "name": "yRange"}], "AvoidRegionCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": null, "required": false, "type": "shape", "name": "shape"}, {"default": 0.95, "required": false, "type": "float", "name": "fraction"}], "PointsCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [], "required": true, "type": "multiplePoints", "name": "list"}], "AvoidConstantCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": null, "required": true, "type": "float", "name": "constant"}, {"default": null, "required": true, "type": "float", "name": "yRange"}], "ConstantCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": null, "required": true, "type": "float", "name": "constant"}], "DomainUsedCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [-Infinity, Infinity], "required": false, "type": "domain", "name": "domain"}, {"default": 0.8, "required": false, "type": "float", "name": "fraction"}], "DerivativeCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [], "required": true, "type": "list", "name": "list"}], "IsHorizontalCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [-Infinity, Infinity], "required": false, "type": "domain", "name": "domain"}, {"default": 0.8, "required": false, "type": "float", "name": "fraction"}, {"default": null, "required": false, "type": "float", "name": "yValue"}, {"default": null, "required": false, "type": "float", "name": "yRange"}], "Criteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}], "FunctionFollowedCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [-Infinity, Infinity], "required": false, "type": "domain", "name": "domain"}, {"default": 0.8, "required": false, "type": "float", "name": "fraction"}, {"default": "", "required": true, "type": "function", "name": "f"}, {"default": 10, "required": false, "type": "integer", "name": "pixelCloseness"}], "IsFunctionCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": [-Infinity, Infinity], "required": false, "type": "domain", "name": "domain"}, {"default": 0.8, "required": false, "type": "float", "name": "fraction"}], "RegionFilledCriteria": [{"default": 1, "required": false, "type": "float", "name": "weight"}, {"default": false, "required": false, "type": "boolean", "name": "failFast"}, {"default": null, "required": false, "type": "shape", "name": "shape"}, {"default": 0.95, "required": false, "type": "float", "name": "fraction"}]};
