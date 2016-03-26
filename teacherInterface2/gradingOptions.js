var possibleCriteria = {
	//'Custom Code':CustomPythonCriteria,
};

for (var prop in criteriaCode) {
	if (prop == "Criteria" || prop.indexOf("Criteria") == -1 || !criteriaCode.hasOwnProperty(prop)) {
		continue;
	}
	prop = prop.slice(0, prop.length-8);
	possibleCriteria[prop] = PythonCriteria;
}

function GradingOptions(dataHandler, refDiv) {
	this.refDiv = refDiv;
	this.dataHandler = dataHandler;
	this.addItemMenu = null;
	this.optionsDiv = null;
	this.criteriaList = [];
	var that = this;

	this.initialize = function() {
		this.optionsDiv = document.createElement('div');
		this.refDiv.appendChild(this.optionsDiv);
		// add item possibilities
		this.addItemMenu = document.createElement('select');
		var newOption = document.createElement('option');
		newOption.innerHTML = 'Add Criteria';
		newOption.value = 'Add Criteria';
		newOption.disabled = true;
		newOption.selected = true;
		this.addItemMenu.appendChild(newOption);
		for (var prop in possibleCriteria) {
			if (!possibleCriteria.hasOwnProperty(prop)) {
				continue; // in case property came from a prototype
			}
			var newOption = document.createElement('option');
			newOption.innerHTML = prop;
			newOption.value = prop;
			this.addItemMenu.appendChild(newOption);
		}
		this.refDiv.appendChild(this.addItemMenu);
	}

	this.setupListeners = function() {
		this.addItemMenu.onchange = function(e) {
			var value = this.options[this.selectedIndex].value;
			if (value != 'Add Criteria') {
				that.addCriteria(value);
			}
			// set back to say 'Add Criteria'
			this.selectedIndex = 0;
		}
	}

	this.criteriaChanged = function() {
		this.dataHandler.setCriteriaOptions(this.getCriteria());

	}

	this.addCriteria = function(type) {
		var criteria = new possibleCriteria[type](this, this.optionsDiv, type);
		this.criteriaList.push(criteria);
		return criteria; // in case it's needed for chaining
	}

	this.removeCriteria = function(criteria) {
		var index = this.criteriaList.indexOf(criteria);
		if (index >= 0) {
			this.optionsDiv.removeChild(this.criteriaList[index].container);
			this.criteriaList.splice(index, 1);
		}
	}

	this.removeAllCriteria = function() {
		for (var i = 0; i < this.criteriaList.length; i++) {
			this.optionsDiv.removeChild(this.criteriaList[i].container);
		}
		this.criteriaList = [];
	}

	//get a list of the criteria in python format string
	this.getCriteria = function() {
		var data = [];
		for (var i = 0; i < this.criteriaList.length; i++) {
			data.push(this.criteriaList[i].getCriteria());
		}
		return data;
	}

	this.setCriteria = function(newList) {
		this.removeAllCriteria();
		for (var i = 0; i < newList.length; i++) {
			var type = newList[i].type;
			var args = newList[i].args;
			var criteria = this.addCriteria(type);
			criteria.setArgs(args);
		}
		this.gradeInterface.gradeCanvas.draw();
	}

	this.initialize();
	this.setupListeners();
}

function BasicCriteria(gradingOptions, refDiv) {
	this.refDiv = refDiv;
	this.gradingOptions = gradingOptions;
	this.container = null;
	this.mainForm = null;
	this.removeButton = null;
	this.helpText = '';
	this.titleText = '';
	var that = this;

	this.initialize = function() {
		this.container = document.createElement('div');
		this.container.style.border = "solid";
		this.refDiv.appendChild(this.container);
		// remove button
		this.removeButton = document.createElement('input');
		this.removeButton.type = 'button';
		this.removeButton.value = 'Remove Criteria';
		this.removeButton.onclick = this.remove;
		this.container.appendChild(this.removeButton);
		// put title text
		this.titleText = document.createElement('h5');
		this.container.appendChild(this.titleText);
		// put help text
		this.helpText = document.createElement('p');
		this.container.appendChild(this.helpText);
		// other parameters
		this.mainForm = document.createElement('form');
		this.container.appendChild(this.mainForm);
	}

	this.setupListeners = function() {
		var that = this;
		this.removeButton.onclick = function(e) {
			that.gradingOptions.removeCriteria(that);
		}
	}

	this.getCriteria = function() {
		return {'type':'BasicCriteria'}
	}

	this.setArgs = function(argsDic) {
		console.log("set args has not been implemented yet");
	}

	this.requiredPolygons = function() {
		return null;
	}

	this.forbiddenPolygons = function() {
		return null;
	}

	this.requiredList = function() {
		return [];
	}

	this.forbiddenList = function() {
		return [];
	}

	this.isRelationshipPresent = function() {
		return false;
	}

	this.relationshipRange = function() {
		return [0,0]; //[xmin,xmax]
	}

	this.relationshipIcon = function() {
		return null; //should be an image
	}

	this.getCriticalPoints = function() {
		return [];
	}

	this.setAllOnchange = function() {
		var nodeList = this.container.getElementsByTagName('input');
		for (var i = 0; i < nodeList.length; i++) {
			nodeList[i].onchange = function(e) {
				that.gradingOptions.criteriaChanged();
				that.gradingOptions.dataHandler.gradeCanvas.draw();
			};
		}
	}

	this.setHelpText = function(text) {
		this.helpText.innerHTML = text;
	}

	this.setTitleText = function(text) {
		this.titleText.innerHTML = text;
	}

	this.remove = function() {
		that.refDiv.removeChild(that.mainForm);
		that.gradingOptions.removeCriteria(that);
	}

	this.initialize();
	this.setupListeners();
}


function InputArg(info, refCriteria) {
	this.info = info;
	this.refCriteria = refCriteria;

	var that = this;
	this.update = function() {
		that.refCriteria.hasChanged = true;
		that.refCriteria.gradingOptions.criteriaChanged();
	}

	this.setValue = function(val) {
		console.log("set value not implemented yet", this.constructor.name);
	}

	// returns [key, value] or null if the value is equal to the default value
	this.getKeyValuePair = function() {
		//return [this.info.name, this.info.default];
		return null;
	}
}

function FloatInput(info, refCriteria) {
	InputArg.call(this, info, refCriteria);
	this.inp = null;
	this.initialize = function() {
		var textnode = document.createTextNode(info.name + " ");
                this.refCriteria.mainForm.appendChild(textnode);
		this.inp = document.createElement('input');
		this.inp.style.width = "40px";
		this.inp.type = 'number';
		this.inp.value = info.default;
		this.refCriteria.mainForm.appendChild(this.inp);
		var br = document.createElement('br');
		this.refCriteria.mainForm.appendChild(br);
	}

	this.setupListeners = function() {
		var that = this;
		this.inp.onchange = this.update;
	}

	this.getValue = function() {
		return new Sk.builtin.float_(this.inp.value);
	}

	this.setValue = function(val) {
		this.inp.value = val;
	}

	this.getKeyValuePair = function() {
		if (this.inp.value != this.info.default)
			return [this.info.name, this.inp.value];
		return null;
	}
	this.initialize();
	this.setupListeners();
}

function IntegerInput(info, refCriteria) {
	InputArg.call(this, info, refCriteria);
	this.inp = null;
	this.initialize = function() {
		var textnode = document.createTextNode(info.name + " ");
                this.refCriteria.mainForm.appendChild(textnode);
		this.inp = document.createElement('input');
		this.inp.style.width = "40px";
		this.inp.type = 'number';
		this.inp.value = info.default;
		this.refCriteria.mainForm.appendChild(this.inp);
		var br = document.createElement('br');
		this.refCriteria.mainForm.appendChild(br);
	}

	this.setupListeners = function() {
		var that = this;
		this.inp.onchange = this.update;
	}

	this.getValue = function() {
		return new Sk.builtin.int_(Number(this.inp.value));
	}

	this.setValue = function(val) {
		this.inp.value = val;
	}

	this.getKeyValuePair = function() {
		if (this.inp.value != this.info.default)
			return [this.info.name, this.inp.value];
		return null;
	}
	this.initialize();
	this.setupListeners();
}

function BooleanInput(info, refCriteria) {
	InputArg.call(this, info, refCriteria);
	this.initialize = function() {
		var textnode = document.createTextNode(info.name + " ");
                this.refCriteria.mainForm.appendChild(textnode);
		var inp = document.createElement('input');
		inp.type = 'radio';
		inp.name = info.name;
		inp.value = true;
		if (info.default == true)
			inp.checked = true;
		inp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(inp);
		this.refCriteria.mainForm.appendChild(document.createTextNode('True'));
		var inp = document.createElement('input');
		inp.type = 'radio';
		inp.name = info.name;
		inp.value = false;
		if (info.default == false)
			inp.checked = true;
		inp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(inp);
		this.refCriteria.mainForm.appendChild(document.createTextNode('False'));
		var br = document.createElement('br');
		this.refCriteria.mainForm.appendChild(br);
	}

	this.getValue = function() {
		var children = this.refCriteria.mainForm.children;
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			if (child.name == this.info.name && child.checked) {
				if (child.value == 'true')
					return Sk.builtin.bool.true$;
				else
					return Sk.builtin.bool.false$;
			}
		}
	}

	this.setValue = function(val) {
		var children = this.refCriteria.mainForm.children;
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			if (child.name == this.info.name && child.value == String(val)) {
				child.checked = true;
			}
		}
	}

	this.getKeyValuePair = function() {
		var val;
		var children = this.refCriteria.mainForm.children;
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			if (child.name == this.info.name && child.checked) {
				if (child.value == 'true')
					val = true;
				else
					val = false;
			}
		}
		if (val != this.info.default) 
			return [this.info.name, val];
		return null;
	}
	this.initialize();
}

function FunctionInput(info, refCriteria) {
	InputArg.call(this, info, refCriteria);
	this.inp = null;
	this.initialize = function() {
		var textnode = document.createTextNode(info.name + " (only variable name should be x:  f(x) = ");
		this.refCriteria.mainForm.appendChild(textnode);
		this.inp = document.createElement('input');
		this.inp.type = 'text';
		this.inp.size = 50;
		this.inp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(this.inp);
		this.refCriteria.mainForm.appendChild(document.createElement('br'));
	}

	this.getValue = function() {
		var code = 'def blah(x): \n    return ' + this.inp.value;
		var module = Sk.importMainWithBody("<stdin>", false, code);
		var func = module.tp$getattr('blah');
		return func;
	}

	this.setValue = function(val) {
		this.inp.value = val;
	}

	this.getKeyValuePair = function() {
		if (this.inp.value != this.info.default)
			return [this.info.name, this.inp.value];
		return null;
	}
	this.initialize();
}

function DomainInput(info, refCriteria) {
	InputArg.call(this, info, refCriteria);
	this.minInp = null;
	this.maxInp = null;
	this.initialize = function() {
		var textnode = document.createTextNode("Domain min: ");
		this.refCriteria.mainForm.appendChild(textnode);
		this.minInp = document.createElement('input');
		this.minInp.style.width = "40px";
		this.minInp.type = 'number';
		this.minInp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(this.minInp);

		textnode = document.createTextNode("Domain max: ");
		this.refCriteria.mainForm.appendChild(textnode);
		this.maxInp = document.createElement('input');
		this.maxInp.style.width = "40px";
		this.maxInp.type = 'number';
		this.maxInp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(this.maxInp);
		this.refCriteria.mainForm.appendChild(document.createElement('br'));
	}

	this.getValue = function() {
		var min = Sk.builtin.float_(this.minInp.value);
		var max = Sk.builtin.float_(this.maxInp.value);
		return Sk.builtin.list([min, max]);
	}

	this.setValue = function(val) {
		this.minInp.value = val[0];
		this.maxInp.value = val[1];
	}

	this.getKeyValuePair = function() {
		var min = this.minInp.value;
		var max = this.maxInp.value;
		if (min == "" && max == "") return null;
		if (min == "") min = -Infinity;
		if (max == "") max = Infinity;
		return [this.info.name, [Number(min), Number(max)]];
	}

	this.initialize();
}

function PointInput(info, criteria) {
	InputArg.call(this, info, criteria);
	this.xInp = null;
	this.yInp = null;
	this.initialize = function() {
		var textnode = document.createTextNode("x: ");
		this.refCriteria.mainForm.appendChild(textnode);
		this.xInp = document.createElement('input');
		this.xInp.type = 'number';
		this.xInp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(this.xInp);

		var textnode = document.createTextNode(" y: ");
		this.refCriteria.mainForm.appendChild(textnode);
		this.yInp = document.createElement('input');
		this.yInp.type = 'number';
		this.yInp.onchange = this.update;
		this.refCriteria.mainForm.appendChild(this.yInp);
		this.refCriteria.mainForm.appendChild(document.createElement('br'));
	}

	this.getValue = function() {
		var x = Sk.builtin.float_(this.xInp.value);
		var y = Sk.builtin.float_(this.yInp.value);
		return Sk.builtin.tuple([x,y]);
	}

	this.setValue = function(val) {
		this.xInp.value = val[0];
		this.yInp.value = val[1];
	}

	this.getKeyValuePair = function() {
		var x = this.xInp.value;
		var y = this.yInp.value;
		return [this.info.name, [x,y]];
	}
	
	this.initialize();
}

function MultiPointInput(info, criteria) {
	InputArg.call(this, info, criteria);
	this.pointInput = null;
	this.next = null;
	this.prev = null;
	this.addButton = null;
	this.deleteButton = null;
	this.myDiv = null;

	this.initialize = function() {
		this.myDiv = document.createElement('div');
		this.refCriteria.mainForm.appendChild(this.myDiv);

		this.addButton = document.createElement('input');
		this.addButton.type = 'button';
		this.addButton.value = 'add';
		this.addButton.onclick = this.addNode;
		this.myDiv.appendChild(this.addButton);

		this.deleteButton = document.createElement('input');
		this.deleteButton.type = 'button';
		this.deleteButton.value = 'delete';
		this.deleteButton.onclick = this.deleteNode;
		this.myDiv.appendChild(this.deleteButton);

		// hacks
		this.mainForm = this.myDiv;
		this.gradingOptions = this.refCriteria.gradingOptions;

		this.pointInput = new PointInput(info, this);
	}

	var that = this;
	this.addNode = function() {
		that.next = new MultiPointInput(that.info, that.refCriteria);
		that.next.prev = that;
	}

	this.deleteNode = function() {
		if (that.prev == null)
			return;
		// fix pointers
		if (that.prev != null)
			that.prev.next = that.next;
		if (that.next != null)
			that.next.prev = that.prev
		// remove div which contains all this
		that.refCriteria.mainForm.removeChild(that.myDiv);
	}

	this.getValue = function() {
		// find head
		var node = this;
		while (node.prev != null)
			node = node.prev;
		// iterate through to get all things
		var l = [];
		while (node != null) {
			l.push(node.pointInput.getValue());
			node = node.next;
		}
		console.log(l);
		return Sk.builtin.list(l);
	}

	this.setValue = function(val) {
		console.log('set value for multipoint not yet implemented');
	}

	this.getKeyValuePair = function() {
		// find head
		var node = this;
		while (node.prev != null)
			node = node.prev;
		// iterate through to get all things
		var l = [];
		while (node != null) {
			l.push(node.getKeyValuePair()[1]);
			node = node.next;
		}
		return [this.info.name, l];
	}

	this.initialize();
}

inputMapping = {
'float':FloatInput,
'integer':IntegerInput,
'boolean':BooleanInput,
'function':FunctionInput,
'domain':DomainInput,
'point':PointInput,
'multiplePoints':MultiPointInput
}

function PythonCriteria(gradingOptions, refDiv, type) {
	type = type;
	BasicCriteria.call(this, gradingOptions, refDiv);
        this.type = type;
	this.code = null;
	this.skModule = null;
	this.inputArgs = {};
	this.otherVars = [];
	this.hasChanged = true;

	this.initialize = function() {
		this.setTitleText(type);
		// figure out what inputs will look like
		var inputs = criteriaInputs[this.type + "Criteria"];
                for (var i = 0; i < inputs.length; i++) {
			this.addInput(inputs[i]);
		}

		// save code into this.code
		this.code = criteriaCode["InputArg"] + "\n\n";
		this.code += criteriaCode["Criteria"] + "\n\n" + criteriaCode[type+"Criteria"];

		// put code into module
		this.skModule = Sk.importMainWithBody("<stdin>", false, this.code);
	}

	this.addInput = function(info) {
		if (info.type in inputMapping) {
			this.inputArgs[info.name] = new inputMapping[info.type](info, this);
		} else {
			var textnode = document.createTextNode(info.name + " ");
	        this.mainForm.appendChild(textnode);
			textnode = document.createTextNode(' ' + info.type + ' not implmented yet');
			this.mainForm.appendChild(textnode);
			var br = document.createElement('br');
			this.mainForm.appendChild(br);
		}
	}

	this.getCriteria = function() {
		var argsDic = {};
		for (var key in this.inputArgs) {
			if (!this.inputArgs.hasOwnProperty(key))
				continue
			var pair = this.inputArgs[key].getKeyValuePair();
			if (pair != null)
				argsDic[pair[0]] = pair[1];
		}
		return {'type':this.type, 'args':argsDic};
	}

	this.setArgs = function(argsDic) {
		for (var key in argsDic) {
			if (!argsDic.hasOwnProperty(key))
				continue;
			this.inputArgs[key].setValue(argsDic[key]);
		}
	}

	this.update = function() {
		if (!this.hasChanged) {
			return;
		}
		var inputDict = [];
		for (var key in this.inputArgs) {
			if (!this.inputArgs.hasOwnProperty(key))
				continue;
			var ia = this.inputArgs[key];
			inputDict.push(new Sk.builtin.str(ia.info.name));
			inputDict.push(ia.getValue());
		}
		inputDict = new Sk.builtin.dict(inputDict);
		var claz = this.skModule.tp$getattr(this.type + "Criteria");
		this.classInst = Sk.misceval.callsim(claz, inputDict);
		this.hasChanged = false;
		this.memo = {};

		var dos = this.gradingOptions.dataHandler.getDisplayOptions();
		var xmin = ['xmin', dos['xaxis']['min']];
		var xmax = ['xmax', dos['xaxis']['max']];
		var ymin = ['ymin', dos['yaxis']['min']];
		var ymax = ['ymax', dos['yaxis']['max']];
		var pixelWidth = ['pixelWidth', dos['xaxis']['pixelDim']];
		var pixelHeight = ['pixelHeight', dos['yaxis']['pixelDim']];
		var lst = [xmin, xmax, ymin, ymax, pixelWidth, pixelHeight];
		this.otherVars = [];
		for (var i = 0; i < lst.length; i++) {
			this.otherVars.push(new Sk.builtin.str(lst[i][0]));
			this.otherVars.push(new Sk.builtin.float_(lst[i][1]));
		}
		this.otherVars = new Sk.builtin.dict(this.otherVars);
	}

	this.requiredPolygons = function() {
		this.update();
		var func = this.classInst.tp$getattr('requiredPolygons');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		if (ret.v == null)
			return null;
		var l = [];
		for (var i = 0; i < ret.v.length; i++) {
			var poly = [];
			var p = ret.v[i].v;
			for (var j = 0; j < p.length; j++) {
				var pij = p[j];
				poly.push([pij.v[0].v, pij.v[1].v]);
			}
			l.push(poly);
		}
		return l;
	}

	this.requiredList = function() {
		this.update();
		if ('requiredList' in this.memo) {
			return this.memo['requiredList'];
		}
		var func = this.classInst.tp$getattr('requiredList');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		var l = [];
		for (var i = 0; i < ret.v.length; i++) {
			var p = ret.v[i];
			l.push([p.v[0].v, p.v[1].v]);
		}
		this.memo['requiredList'] = l;
		return l;
	}

	this.forbiddenPolygons = function() {
		this.update();
		var func = this.classInst.tp$getattr('forbiddenPolygons');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		if (ret.v == null)
			return null;
		var l = [];
		for (var i = 0; i < ret.v.length; i++) {
			var poly = [];
			var p = ret.v[i].v;
			for (var j = 0; j < p.length; j++) {
				var pij = p[j];
				poly.push([pij.v[0].v, pij.v[1].v]);
			}
			l.push(poly);
		}
		return l;

	}

	this.forbiddenList = function() {
		this.update();
		if ('forbiddenList' in this.memo) {
			return this.memo['forbiddenList'];
		}
		var func = this.classInst.tp$getattr('forbiddenList');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		var l = [];
		for (var i = 0; i < ret.v.length; i++) {
			var p = ret.v[i];
			l.push([p.v[0].v, p.v[1].v]);
		}
		this.memo['forbiddenList'] = l;
		return l;
	}

	this.isRelationshipPresent = function() {
		this.update();
		var func = this.classInst.tp$getattr('isRelationshipPresent');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		if (ret.v == 1)
			return true;
		else
			return false;
	}

	this.relationshipRange = function() {
		this.update();
		var func = this.classInst.tp$getattr('relationshipRange');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		var l = [ret.v[0].v, ret.v[1].v];
		return l;
	}

	this.relationshipIcon = function(callbackFunc) {
		this.update();
		var func = this.classInst.tp$getattr('relationshipIcon');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		var img = new Image();
		img.src = ret.v;
		img.onload = function(){callbackFunc(img);};
		return img;
	}

	this.getCriticalPoints = function() {
		this.update();
		var func = this.classInst.tp$getattr('getCriticalPoints');
		var ret = Sk.misceval.callsim(func, this.otherVars);
		var l = [];
		for (var i = 0; i < ret.v.length; i++) {
			var d = ret.v[i];
			universal = d;
			var x = d.mp$lookup(Sk.builtin.str('x')).v;
			var y = d.mp$lookup(Sk.builtin.str('y')).v;
			var pr = d.mp$lookup(Sk.builtin.str('pixelRadius')).v;
			l.push({'x':x, 'y':y, 'pixelRadius':pr});
		}
		return l;
	}

	this.initialize();
}

function CustomPythonCriteria(gradingOptions, refDiv) {
	BasicCriteria.call(this, gradingOptions, refDiv);
	this.code = null;
	this.skModule = null;
	this.runButton = null;
	this.visualizeButton = null;
	this.debugOutput = null;
	this.isRequiredMemo = null;
	this.isForbiddenMemo = null;	
	
	this.initialize = function() {
		this.setHelpText("Put your custom python code.");
		this.setTitleText("Custom Python Code");
		//code area
		this.code = document.createElement('textarea');
		this.code.rows = 24;
		this.code.cols = 80;
		this.code.value = 'class NewCriteria():\n';
		//this.code.value += '    def __init__(self, **kwargs):\n';
		//this.code.value += '        Criteria.__init__(self, **kwargs)\n';
		this.code.value += '    def grade(self, graphData):\n';
		this.code.value += '        return (1., None)\n';
		this.code.value += '    def isNothingRequired(self):\n';
		this.code.value += '        return True\n';
		this.code.value += '    def isRequired(self,x,y):\n';
		this.code.value += '        x, y = float(x), float(y)\n';
		this.code.value += '        return False\n';
		this.code.value += '    def isNothingForbidden(self):\n';
		this.code.value += '        return True\n';
		this.code.value += '    def isForbidden(self, x, y):\n';
		this.code.value += '        x, y = float(x), float(y)\n';
		this.code.value += '        return False\n';
		this.code.value += '\n\n\n#make sure to make a criteria instance with whatever args you want\n';
		this.code.value += 'criteriaInstance = NewCriteria()';
		this.mainForm.appendChild(this.code);
		//run button
		this.runButton = document.createElement('input');
		this.runButton.type = 'button';
		this.runButton.value = 'run';
		this.mainForm.appendChild(this.runButton);
		//update visualizer button
		this.visualizeButton = document.createElement('input');
		this.visualizeButton.type = 'button';
		this.visualizeButton.value = 'visualize';
		this.mainForm.appendChild(this.visualizeButton);
		//debug area
		this.debugOutput = document.createElement('pre');
		this.mainForm.appendChild(this.debugOutput);
	}
	var that = this;
	this.outf = function(text) {
		that.showPythonOutput(text+'\n');
	}

	this.showPythonOutput = function(text) {
		this.debugOutput.innerHTML += text;
	}

	this.setupListeners = function() {
		var that = this;
		this.runButton.onclick = function(e) {
			that.debugOutput.innerHTML = "";
			var prog = that.code.value;
			Sk.configure({output:that.outf});
			try {
				that.skModule = Sk.importMainWithBody("<stdin>", false, prog);
			} catch(e) {
				that.outf(e);
			}
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}
	}

	this.getCriteria = function() {
		var data = {'type':'CustomCode'};
		data['code'] = this.code.value;
		return data;
	}

	this.isNothingRequired = function() {
		var critInst = this.skModule.tp$getattr('criteriaInstance');
		var funcName = critInst.tp$getattr('isNothingRequired');
		var ret = Sk.misceval.callsim(funcName);
		return Boolean(ret.v);
	}

	this.isRequired = function(x,y) {
		var critInst = this.skModule.tp$getattr('criteriaInstance');
		var funcName = critInst.tp$getattr('isRequired');
		var ret = Sk.misceval.callsim(funcName, x, y);
		return Boolean(ret.v);
	}

	this.isNothingForbidden = function() {
		var critInst = this.skModule.tp$getattr('criteriaInstance');
		var funcName = critInst.tp$getattr('isNothingForbidden');
		var ret = Sk.misceval.callsim(funcName);
		return Boolean(ret.v);
	}

	this.isForbidden = function(x,y) {
		var critInst = this.skModule.tp$getattr('criteriaInstance');
		var funcName = critInst.tp$getattr('isForbidden');
		var ret = Sk.misceval.callsim(funcName, x, y);
		return Boolean(ret.v);
	}

	this.initialize();
	this.setupListeners();
}
