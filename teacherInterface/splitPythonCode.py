import inspect
import imp
import sys
import json

def getModule(name, filename):
    f = open(filename, 'U')
    description = ('.py', 'U', 1)
    # add path to sys.path in case it's needed
    s = filename.split('/')[:-1]
    if len(s) > 0:
        sys.path.append('/'.join(s))
    mod = imp.load_module(name, f, filename, description)
    f.close()
    return mod

def splitPyFile(filename, filterFunc = None):
    if filterFunc == None:
        filterFunc = lambda x: True
    mod = getModule('blah', filename)
    failed = []
    code = {}
    for k in mod.__dict__:
        c = mod.__dict__[k]
        if filterFunc(k) and inspect.isclass(c):
            try:
                code[k] = inspect.getsource(c)
            except:
                failed.append(k)
    return code, failed

def makeJavascript(codeDict): 
    js = '{'
    for k in codeDict:
        first = str(k)
        second = repr(str(codeDict[k]))[1:-1].replace('"',r'\"')
        print(second[:100])
        second = "from math import *\\n" + second
        thing = '"{!s}": "{!s}"'.format(first, second)
        js += thing + ",\n"
    return js[:-2] + '}'

def getJavascriptInputs(filename, filterFunc = None):
    if filterFunc == None:
        filterFunc = lambda x: True
    mod = getModule('blah', filename)
    failed = []
    inputs = {}
    # get lists of InputArg instance
    for k in mod.__dict__:
        c = mod.__dict__[k]
        if filterFunc(k) and inspect.isclass(c):
            try:
                inputs[k] = c.args
            except:
                failed.append(k)
    answer = {}
    for k in inputs:
        d = inputs[k]
        new = []
        for inp in d:
            new.append(inp.getDict())
        answer[k] = new
    answer = json.dumps(answer)
    return answer, failed


code, failed = splitPyFile(r'../studentInterface/criteria.py', lambda x: 'Criteria' in x or x == 'InputArg')
print 'failed from getting classes:', failed
inputs, failed = getJavascriptInputs(r'../studentInterface/criteria.py', lambda x: 'Criteria' in x)
print 'failed from getting inputs:', failed
f = open('pyCodeVar.js','w')
f.write('criteriaCode = ' + makeJavascript(code) + ';\n')
f.write('criteriaInputs = ' + inputs + ';\n')
f.close()

