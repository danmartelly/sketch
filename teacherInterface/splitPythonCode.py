import inspect
import imp
import sys

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
        thing = '"{!s}": "{!s}"'.format(first, second)
        js += thing
    return js + '}'

#print splitPyFile('blah','testSplit.py', lambda x: 'est' in x)

code, failed = splitPyFile(r'../studentInterface/criteria.py', lambda x: 'Criteria' in x)
#print code
print '""""'.replace('"','\\"')

f = open('pyCodeVar.js','w')
f.write('criteriaCode = ' + makeJavascript(code))
f.close()

