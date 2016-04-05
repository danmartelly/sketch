
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




