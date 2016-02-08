import json
import math
#import tvregdiff as tvrd
import dataFuncs
import numpy as np

class Point:
    def __init__(self, x, y, label = ''):
        self.x = x
        self.y = y
        self.label = label
    def close(self, other, epsilon):
        magSquared = (self.x-other.x)**2 + (self.y-other.y)**2
        return magSquared < epsilon**2
    def __getitem__(self, index):
        if index == 0: return self.x
        elif index == 1: return self.y
        elif index == 2: return self.label
        else: raise IndexError
    def __iter__(self):
        for a in [self.x, self.y]:
            yield a
    def __repr__(self):
        return 'Point' + str((self.x, self.y))
    def __add__(self, other):
        return Point(self.x+other.x, self.y+other.y)
    def __sub__(self, other):
        return Point(self.x-other.x, self.y-other.y)

class GraphData:
    def __init__(self, rawJSONString):
        decoded = json.loads(rawJSONString)
	axisData = decoded['axes']
        drawingData = decoded['drawing']
        criticalPointData = decoded['criticalPoints']
	# axis data
        self.pixelHeight = int(axisData['yaxis']['pixels'])
        self.ymin = float(axisData['yaxis']['min'])
        self.ymax = float(axisData['yaxis']['max'])
        self.ystep = float(axisData['yaxis']['step'])
        self.pixelWidth = int(axisData['xaxis']['pixels'])
        self.xmin = float(axisData['xaxis']['min'])
        self.xmax = float(axisData['xaxis']['max'])
        self.xstep = float(axisData['xaxis']['step'])
        # drawing data
        tempPixels = drawingData['blackPixels']
        self.blackPixels = []
        self.xyPoints = []
        for bp in tempPixels:
            i, j = int(bp['i']), int(bp['j'])
            self.blackPixels.append(Point(i,j))
            x, y = self.xyFromIndex(i,j)
            self.xyPoints.append(Point(x,y))
        self.blackPixels.sort(key=lambda x: x[0])
        # critical point data
        self.criticalIndices = criticalPointData['usedPointList']
        self.xyCritical = []
        for cp in self.criticalIndices:
            x, y = self.xyFromIndex(cp['i'], cp['j'])
            self.xyCritical.append(Point(x,y,cp['label']))


    def xyFromIndex(self, i,j):
        i, j = float(i), float(j)
        x = (i/self.pixelWidth)*(self.xmax-self.xmin) + self.xmin
        y = self.ymax - (j/self.pixelHeight)*(self.ymax-self.ymin)
        return Point(x, y)

    def indexFromXY(self, x, y):
        x, y = float(x), float(y)
        i = (x - self.xmin)/float(self.xmax-self.xmin)*self.pixelWidth
        j = (self.ymax - y)/float(self.ymax-self.ymin)*self.pixelHeight
        return Point(int(round(i)), int(round(j)))

    def getFunctionList(self):
        if hasattr(self, 'functionList'):
            return self.functionList
        self.functionList = []
        d = {}
        for p in self.xyPoints:
            d[p.x] = d.get(p.x,[]) + [p.y]
        for x in d:
            y = float(sum(d[x]))/len(d[x])
            self.functionList.append(Point(x, y))
        self.functionList.sort(key=lambda p: p.x)
        return self.functionList

    def interpolate(self, x, l):
        ''' Linearly interpolate a list, l, of Points
        Return corresponding y
        '''
        # find point that is just a little smaller than the value x
        # using binary search
        if len(l) == 0: return None
        if len(l) == 1 or x < l[0].x: return l[0].y
        if x > l[-1].x: return l[-1].y
        
        lo, hi = 0, len(l) - 1
        while lo < hi:
            mid = (hi-lo)/2 + lo
            if l[mid].x < x:
                lo = mid + 1
            else:
                hi = mid - 1
        # lo and hi should be equal now
        if l[lo].x == x:
            return l[lo].y
        elif l[lo].x < x:
            x0, y0 = l[lo].x, l[lo].y
            x1, y1 = l[lo+1].x, l[lo+1].y
        else:
            x0, y0 = l[lo-1].x, l[lo-1].y
            x1, y1 = l[lo].x, l[lo].y
        # linear interpolation equation
        return y0 + (y1 - y0)*(x - x0)/float(x1 - x0)
        

    def getFunction(self):
        if hasattr(self, 'function'):
            return self.function
        self.function = lambda x: self.interpolate(x,self.getFunctionList())
        return self.function

    def gaussBlur(self, l):
        ans = []
        radius = 4
        sigma = 5.
        def gauss(r):
            return 1./math.sqrt(2.*math.pi*sigma**2.)*math.exp(-(r**2.)/(2.*sigma**2.))
        convolve = [gauss(ind) for ind in xrange(-radius, radius+1)]
        for i in xrange(len(l)):
            if l[i] == None: continue
            relevant = [(l[i+diff].y, convolve[radius + diff]) for diff in range(-radius, radius+1) if i+diff >= 0 and i+diff < len(l) and l[i+diff] != None]
            summ = sum([t[0]*t[1] for t in relevant])
            avg = summ/sum([t[1] for t in relevant])
            ans.append(Point(l[i].x, avg))
        return ans

    def getGaussFunctionList(self):
        if hasattr(self, 'gFunctionList'):
            return self.gFunctionList
        if len(self.getFunctionList()) < 3:
            self.gFunctionList = self.getFunctionList()
            return self.gFunctionList
        i = -1
        tempList = []
        for bp in self.blackPixels:
            newi = bp[0]
            if i != -1 and newi > i:
                tempList.extend([None for _ in range(i, newi)])
            if newi > i:
                i = newi
                x,_ = self.xyFromIndex(i, 0)
                y = self.getFunction()(x)
                tempList.append(Point(x,y))
        self.gFunctionList = self.gaussBlur(tempList)
        return self.gFunctionList

    def getGaussFunction(self):
        if hasattr(self, 'gaussFunction'):
            return self.gaussFunction
        self.gaussFunction = lambda x: self.interpolate(x,self.getGaussFunctionList())
        return self.gaussFunction

    def getSimpleDerivList(self):
        if hasattr(self, 'simpleDerivList'):
            return self.simpleDerivList
        self.simpleDerivList = []
        l = self.getFunctionList()
        for i in range(len(l)-1):
            x0, y0 = l[i].x, l[i].y
            x1, y1 = l[i+1].x, l[i+1].y
            self.simpleDerivList.append(Point(x0, float(y1-y0)/(x1-x0)))
        return self.simpleDerivList

    def getPixelDiff(self):
        if hasattr(self, 'pixelDiff'):
            return self.pixelDiff
        self.pixelDiff = []
        jovery = -self.pixelHeight/float(self.ymax-self.ymin)
        ioverx = self.pixelWidth/float(self.xmax-self.xmin)
        converter = jovery/ioverx
        for diff in self.getSimpleDerivList():
            i = self.indexFromXY(diff.x, 0)[0]
            pDiff = diff.y*converter
            self.pixelDiff.append(Point(i, pDiff))
        return self.pixelDiff

    def getSmoothDerivList(self):
        if hasattr(self, 'smoothDerivList'):
            return self.smoothDerivList
        if len(self.getFunctionList()) < 3:
            self.smoothDerivList = []
            return self.smoothDerivList
        # points must be evenly spaced apart
        step = self.xyFromIndex(2,0)[0] - self.xyFromIndex(1,0)[0]
        fl = self.getFunctionList()
        startx, endx = fl[0].x, fl[-1].x
        xs = []
        while startx <= endx:
            xs.append(startx)
            startx += step
        tempList = [self.getFunction()(x) for x in xs]
        der = tvrd.TVRegDiff(tempList, 50, 1e-1, scale='large', plotflag=0, diagflag=0)
        self.smoothDerivList = [Point(xs[i], der[i]) for i in range(len(xs))]
        return self.smoothDerivList

    def getSmoothDerivFunction(self):
        if hasattr(self, 'smoothDerivFunction'):
            return self.smoothDerivFunction
        self.smoothDerivFunction = lambda x: self.interpolate(x, self.getSmoothDerivList())
        return self.smoothDerivFunction

    def getAvgPixelIncrease(self, lo=-float('inf'), hi=float('inf')):
        l = self.getSimpleDerivList()
        if len(l) <= 0: return None
        avgIncr = sum([p.y for p in l if p.x >= lo and p.x <= hi])/float(len(l))
        pixPerY = self.canvasHeight/float(ymax-ymin)
        pixPerX = self.canvasWidth/float(xmax-xmin)
        return avgIncr*(pixPerY/pixPerX)



   

