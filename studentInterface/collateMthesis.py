import ast
import os
import criteria
import graphUtil as util

# criteria copied from tutor version
Rp = 10000.
def f(a):
    Rt = a*Rp*50./(a*Rp+50.)
    return 10.*Rt/((1.-a)*Rp + Rt)

allCriteria = {('power','q000001'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 100*500./(500.+x)**2}},
{'type':'Monotonic', 'args':{'trend':-1}},
{'type':'Points', 'args':{'list':[(0,.2)]}}
],
('power','q000002'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 100.*x/(500.+x)**2.}},
{'type':'Monotonic', 'args':{'trend':1, 'domain':[0,200]}},
{'type':'Monotonic', 'args':{'trend':-1, 'domain':[500,1000]}},
{'type':'Points', 'args':{'list':[(0,0)]}}
],
('power','q000003'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 100./(500.+x)}},
{'type':'Monotonic', 'args':{'trend':-1}},
{'type':'Points', 'args':{'list':[(0,0.2)]}}
],
('power','q000004'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsHorizontal', 'args':{'yValue':0.2, 'yRange':0.05}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 0.2, 'weight':0}}
],
('power','q000005'):[
{'type':'DomainUsed', 'args':{'fraction':.7, 'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 100./x}},
{'type':'Monotonic', 'args':{'trend':-1}}
],
('power','q000006'):[
{'type':'DomainUsed', 'args':{'fraction':.7, 'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 100./x + .2}},
{'type':'Monotonic', 'args':{'trend':-1}}
],
('thevenins','q000000'):[
{'type':'DomainUsed', 'args':{'weight':.1, 'fraction':.6, 'failFast':True}},
{'type':'IsFunction', 'args':{'weight':.1, 'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 2/3.*x - 4}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(6,0), (0,-4)]}}
],
('thevenins','q000001'):[
{'type':'DomainUsed', 'args':{'weight':.1, 'fraction':.6, 'failFast':True}},
{'type':'IsFunction', 'args':{'weight':.1, 'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 1./3.*x-1.}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(3,0), (0,-1)]}}
],
('thevenins','q000002'):[
{'type':'DomainUsed', 'args':{'weight':.1, 'fraction':.6, 'failFast':True}},
{'type':'IsFunction', 'args':{'weight':.1, 'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: 3/13.*x - 27./13.}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(9,0), (0,-27./13.)]}}
],
('potLoading','q000000'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':f, 'domain':(0.1,.8)}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(0,0), (1,10)]}}
],
('potLoading','q000001'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':f}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(0,2), (1,10)]}}
],
('potLoading','q000002'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':f}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(0,10./3), (1,20./3)], 'pixelCloseness':20}}
],
('potLoading','q000003'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':f}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(0,0), (1,10)]}}
],
('potLoading','q000004'):[
{'type':'DomainUsed', 'args':{'failFast':True}},
{'type':'IsFunction', 'args':{'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':f}},
{'type':'Monotonic', 'args':{'trend':1}},
{'type':'Points', 'args':{'list':[(0,5), (1,10)]}}
],
('nyan','q000005'):[
{'type':'DomainUsed', 'args':{'weight':.1, 'failFast':True}},
{'type':'IsFunction', 'args':{'weight':.1, 'failFast':True}},
{'type':'FunctionFollowed', 'args':{'f':lambda x: max(0, min(10, 5.2 + (5.2-x)*1.86))}},
{'type':'Monotonic', 'args':{'trend':-1}},
{'type':'Points', 'args':{'list':[(2.5,10), (8,0)]}}
]
}

# gather data into dictionary with key as problem number, 
# value as list of tuples (username, grade, feedback)
def collate(filenames):
    answer = {}
    for fname in filenames:
        newList = []
        f = open(fname, 'r')
        for line in f:
            try:
                d = ast.literal_eval(line)
            except:
                print 'failed ast.literal_eval'
                continue
            temp = fname.split('_')
            probName = temp[0].split('/')[-1]
            questionName = temp[1]
            grader = criteria.createGrader(allCriteria[(probName,questionName)])
            username = d['username']
            data = d['data']
            if data == '{}': continue
            grade, feedback = grader.grade(util.GraphData(data))
            newList.append((username, grade, feedback))
        f.close()
        newList.sort(key=lambda x: x[1])
        answer[fname] = newList
    return answer

baseURL = 'https://sicp-s4.mit.edu/tutor/index.py/6.01/martellyThesis/'
def makeHTMLLinkList(dataList, probName, questionName):
    ''' data should be a list of (username, grade, feedback)'''
    html = ''
    for (username, grade, feedback) in dataList:
        url = baseURL + probName + "?as=" + username + "#" + questionName + "_sketchDiv"
        html += '<a href="%s">%s</a>' % (url, username)
        html += '%s %s<br>\n' % (grade, feedback)
    return html

def makeHTMLPages(filenames):
    d = collate(filenames)
    collection = {} # keys: probName, values: list of (questionName, HTML link list)
    for k in d:
        temp = k.split('_')
        probName = temp[0].split('/')[-1]
        questionName = temp[1]
        htmlList = makeHTMLLinkList(d[k], probName, questionName)
        if probName not in collection: collection[probName] = []
        collection[probName].append((questionName, htmlList))
    answer = {}
    for probName in collection:
        collection[probName].sort(key=lambda x:x[0])
        html = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
        html += '<html><head><title>%s</title></head><body>' % probName
        html += '<table border="1"><tr>'
        for (questionName, htmlList) in collection[probName]:
            html += '<td>%s</td>' % questionName
        html += '</tr>\n<tr>\n'
        for (questionName, htmlList) in collection[probName]:
            html += '<td>%s</td>' % htmlList
        html += '</tr>\n</table>\n'
        html += '</body></html>'
        answer[probName] = html
    # Add one more key for the navigation page to the rest of the things
    html = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
    html += '<html><head><title>Navigation</title></head><body>'
    for probName in collection:
        html += '<a href="?probName=%s">%s</a><br>' % (probName, probName)
    html += '</body></html>'
    answer['navigation'] = html
    return answer
        

filenames = os.listdir('./mthesisData/')
for i in range(len(filenames)):
    filenames[i] = './mthesisData/' + filenames[i]
d = collate(filenames)
#print makeHTMLLinkList(d[d.keys()[0]],'blah', 'q310984')
htmls = makeHTMLPages(filenames)
f = open('mthesishtmls.txt','w')
f.write(str(htmls))
f.close()
print 'done writing'
