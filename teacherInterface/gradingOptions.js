var possibleCriteria = {
	'Domain Filled':DomainFilledCriteria,
	'Domain Avoided':DomainAvoidedCriteria,
	'Function Followed':FunctionFollowedCriteria,
	'Function Avoided':FunctionAvoidedCriteria,
	'Montonicity':MonotonicCriteria,
	'Python Code':PythonCriteria,
	'Critical Points':CriticalPointCriteria,
};

function GradingOptions(gradeInterface, refDiv) {
	this.refDiv = refDiv;
	this.gradeInterface = gradeInterface;
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

	this.addCriteria = function(type) {
		var criteria = new possibleCriteria[type](this, this.optionsDiv);
		this.criteriaList.push(criteria);
	}

	this.removeCriteria = function(criteria) {
		var index = this.criteriaList.indexOf(criteria);
		if (index >= 0) {
			this.optionsDiv.removeChild(this.criteriaList[index].container);
			this.criteriaList.splice(index, 1);
		}
	}

	//get a list of the criteria in python format string
	this.getCriteria = function() {
		var data = [];
		for (var i = 0; i < this.criteriaList.length; i++) {
			data.push(this.criteriaList[i].getCriteria());
		}
		return data;
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

	this.isNothingRequired = function() {
		return true;
	}

	this.isRequired = function(x,y) {
		return !this.isNothingRequired();
	}

	this.isNothingForbidden = function() {
		return true;
	}

	this.isForbidden = function(x,y) {
		return !this.isNothingForbidden();
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
				that.gradingOptions.gradeInterface.gradeCanvas.draw();
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

function DomainFilledCriteria(gradingOptions, refDiv) {
	BasicCriteria.call(this, gradingOptions, refDiv);
	this.minInput = null;
	this.maxInput = null;
	this.xmin = -Infinity;
	this.xmax = Infinity;
	this.fractionInput = null;

	this.initialize = function() {
		this.setHelpText('Choose how much of the domain should be drawn on.');
		this.setTitleText('Use this domain');
		// minimum
		var textnode = document.createTextNode('Minimum: ');
		this.mainForm.appendChild(textnode);
		this.minInput = document.createElement('input');
		this.minInput.type = 'number';
		this.mainForm.appendChild(this.minInput);
		//maximum
		textnode = document.createTextNode('  Maximum: ');
		this.mainForm.appendChild(textnode);
		this.maxInput = document.createElement('input');
		this.maxInput.type = 'number';
		this.mainForm.appendChild(this.maxInput);
		// fraction
		textnode = document.createTextNode('  Fraction Filled (between 0 and 1): ');
		this.mainForm.appendChild(textnode);
		this.fractionInput = document.createElement('input');
		this.fractionInput.type = 'number';
		this.fractionInput.defaultValue = .9;
		this.mainForm.appendChild(this.fractionInput);
		this.setAllOnchange();
	}

	this.setupListeners = function() {
		var that = this;
		this.minInput.onchange = function(e) {
			that.xmin = Number(this.value);
			if (Number.isNaN(that.xmin))
				that.xmin = -Infinity;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.maxInput.onchange = function(e) {
			that.xmax = Number(this.value);
			if (Number.isNaN(that.xmax))
				that.xmax = Infinity;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}
	}

	this.getCriteria = function() {
		var data = {'type':'DomainUsed'};
		if (this.xmax != Infinity || this.xmin != -Infinity) {
			data['domain'] = [this.xmin, this.xmax];
		}
		var fracVal = this.fractionInput.value;
		if (fracVal != "" && !Number.isNaN(Number(fracVal))) {
			data['fraction'] = Number(fracVal);
		}
		return data;
	}

	this.isNothingRequired = function() {
		return false;
	}

	this.isRequired = function(x,y) {
		return x > this.xmin && x < this.xmax;
	}

	this.initialize();
	this.setupListeners();
}
function DomainAvoidedCriteria(gradingOptions, refDiv) {
	DomainFilledCriteria.call(this, gradingOptions, refDiv);

	this.initialize = function() {
		this.setHelpText('Choose what domain students should not draw on');
		this.setTitleText('Avoid this domain');
	}

	this.getCriteria = function() {
		var data = {'type':'DomainAvoided'};
		if (this.xmax != Infinity || this.xmin != -Infinity) {
			data['domain'] = [this.xmin, this.xmax];
		}
		var fracVal = this.fractionInput.value;
		if (fracVal != "" && !Number.isNaN(Number(fracVal))) {
			data['fraction'] = Number(fracVal);
		}
		return data;
	}

	this.isNothingRequired = function() {
		return true;
	}

	this.isRequired = function(x,y) {
		return false;
	}


	this.isNothingForbidden = function() {
		return false;
	}

	this.isForbidden = function(x, y) {
		return x > this.xmin && x < this.xmax;
	}

	this.initialize();
}

function FunctionFollowedCriteria(gradingOptions, refDiv) {
	BasicCriteria.call(this, gradingOptions, refDiv);
	this.minInput = null;
	this.maxInput = null;
	this.equationInput = null;
	this.xClosenessInput = null;
	this.yClosenessInput = null;
	this.fractionInput = null;
	this.xmin = -Infinity;
	this.xmax = Infinity;
	this.xclose = null;
	this.yclose = null;
	this.func = null;
	this.plotList = [];
	var that = this;

	this.initialize = function() {
		this.setHelpText('Values within region must be close enough to python equation specified.');
		this.setTitleText('Follow Function Criteria');
		// minimum
		var textnode = document.createTextNode('Minimum: ');
		this.mainForm.appendChild(textnode);
		this.minInput = document.createElement('input');
		this.minInput.type = 'number';
		this.mainForm.appendChild(this.minInput);
		//maximum
		textnode = document.createTextNode('  Maximum: ');
		this.mainForm.appendChild(textnode);
		this.maxInput = document.createElement('input');
		this.maxInput.type = 'number';
		this.mainForm.appendChild(this.maxInput);
		this.mainForm.appendChild(document.createElement('br'));
		// equation
		textnode = document.createTextNode('y = ');
		this.mainForm.appendChild(textnode);
		this.equationInput = document.createElement('input');
		this.equationInput.defaultValue = 0;
		this.mainForm.appendChild(this.equationInput);
		// x closeness
		textnode = document.createTextNode('  X closeness:');
		this.mainForm.appendChild(textnode);
		this.xClosenessInput = document.createElement('input');
		this.xClosenessInput.type = 'number';
		this.xClosenessInput.defaultValue = 0;
		this.mainForm.appendChild(this.xClosenessInput);
		// y closeness
		textnode = document.createTextNode('  Y closeness:');
		this.mainForm.appendChild(textnode);
		this.yClosenessInput = document.createElement('input');
		this.yClosenessInput.type = 'number';
		this.yClosenessInput.defaultValue = 0;
		this.mainForm.appendChild(this.yClosenessInput);

		this.mainForm.appendChild(document.createElement('br'));
		// fraction
		textnode = document.createTextNode('  Fraction of points following constraint (between 0 and 1): ');
		this.mainForm.appendChild(textnode);
		this.fractionInput = document.createElement('input');
		this.fractionInput.type = 'number';
		this.fractionInput.defaultValue = .9;
		this.mainForm.appendChild(this.fractionInput);

		this.setAllOnchange();
	}

	this.setupListeners = function() {
		var that = this;
		this.minInput.onchange = function(e) {
			that.xmin = Number(this.value);
			if (Number.isNaN(that.xmin))
				that.xmin = -Infinity;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.maxInput.onchange = function(e) {
			that.xmax = Number(this.value);
			if (Number.isNaN(that.xmax))
				that.xmax = Infinity;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.equationInput.onchange = function(e) {
			that.parseEquation(this.value);
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.xClosenessInput.onchange = function(e) {
			that.xclose = Number(this.value);
			if (Number.isNaN(that.xclose))
				that.xclose = null;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.yClosenessInput.onchange = function(e) {
			that.yclose = Number(this.value);
			if (Number.isNaN(that.yclose))
				that.yclose = null;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}
	}

	this.getCriteria = function() {
		var data = {'type':'FunctionFollowed'};
		if (this.xmax != Infinity || this.xmin != -Infinity) {
			data['domain'] = [this.xmin, this.xmax];
		}
		var fracVal = this.fractionInput.value;
		if (fracVal != "" && !Number.isNaN(Number(fracVal))) {
			data['fraction'] = Number(fracVal);
		}
		data['f'] = 'lambda x: ' + this.equationInput.value;
		data['xclose'] = this.xclose;
		data['yclose'] = this.yclose;
		return data;
	}

	this.parseEquation = function(string) {
		var code = '#from bnm.math import *\n';
		code += 'def f(x):\n';
		code += '    x = float(x)\n';
		code += '    return ' + string;
		var f = null;
		try {
			var module = Sk.importMainWithBody("<stdin>", false, code);
			f = module.tp$getattr('f');
			this.func = function(x) {
				var ret = Sk.misceval.callsim(f, x);
				return Number(ret.v);
			}
		} catch (e) {
			alert(e);
			this.func = null;
		}
		//this.func = Equation.parseEquation(string);
		this.plotList = [];
		if (this.func == null) {
			return;
		}
		var i, j, x, y;
		for (i = 0; i < this.gradingOptions.gradeInterface.width; i++) {
			x = this.gradingOptions.gradeInterface.xAxis.xFromIndex(i);
			y = this.func(x);
			if (typeof(y) != 'number')
				return;
			j = this.gradingOptions.gradeInterface.yAxis.indexFromY(y);
			this.plotList.push([i,j]);
		}
	}

	this.isNothingRequired = function() {
		console.log('func,xclose,yclose',this.func,this.xclose,this.yclose);
		return this.func == null || this.xclose == null || this.yclose == null;
	}

	this.isRequired = function(x,y) {
		if (this.func == null || this.xclose == null || this.yclose == null)
			return false;
		if (x < this.xmin || x > this.xmax)
			return false;
		var fy = this.func(x);
		if (Math.abs(y-fy) < this.yclose)
			return true;
		return false; 
	}

	this.isNothingForbidden = function() {
		return this.func == null || this.xclose == null || this.yclose == null;
	}

	this.isForbidden = function(x,y) {
		if (this.func == null || this.xclose == null || this.yclose == null)
			return false;
		if (x < this.xmin || x > this.xmax)
			return false;
		var fy = this.func(x);
		if (Math.abs(y-fy) < this.yclose)
			return false;
		return true; 
	}

	this.initialize();
	this.setupListeners();
}

function FunctionAvoidedCriteria(gradingOptions, refDiv) {
	FunctionFollowedCriteria.call(this, gradingOptions, refDiv);

	this.initialize = function() {
		this.setHelpText("Student's drawings in this region must be avoided");
		this.setTitleText('Avoid the function');
	}

	this.getCriteria = function() {
		var data = {'type':'FunctionAvoided'};
		if (this.xmax != Infinity || this.xmin != -Infinity) {
			data['domain'] = [this.xmin, this.xmax];
		}
		var fracVal = this.fractionInput.value;
		if (fracVal != "" && !Number.isNaN(Number(fracVal))) {
			data['fraction'] = Number(fracVal);
		}
		data['f'] = 'lambda x: ' + this.equationInput.value;
		data['xclose'] = this.xclose;
		data['yclose'] = this.yclose;
		return data;
	}


	this.isNothingRequired = function() {
		return true;
	}

	this.isRequired = function(x,y) {
		return false;
	}

	this.isNothingForbidden = function() {
		console.log('func,xclose,yclose',this.func,this.xclose,this.yclose);

		return this.func == null || this.xclose == null || this.yclose == null;
	}

	this.isForbidden = function(x,y) {
		if (this.func == null || this.xclose == null || this.yclose == null)
			return false;
		if (x < this.xmin || x > this.xmax)
			return false;
		var fy = this.func({'x':x});
		if (Math.abs(y-fy) < this.yclose)
			return true;
		return false;
	}

	this.initialize();
}

function MonotonicCriteria(gradingOptions, refDiv) {
	BasicCriteria.call(this, gradingOptions, refDiv);
	this.minInput = null;
	this.maxInput = null;
	this.xmin = -Infinity;
	this.xmax = Infinity;
	this.trend = 'up';
	this.upIcon = null;
	this.downIcon = null;
	this.updownIcon = null;

	this.initialize = function() {
		this.setHelpText('Check whether the graph is montonic.');
		this.setTitleText('Montonicity');
		// minimum
		var textnode = document.createTextNode('Minimum: ');
		this.mainForm.appendChild(textnode);
		this.minInput = document.createElement('input');
		this.minInput.type = 'number';
		this.mainForm.appendChild(this.minInput);
		//maximum
		textnode = document.createTextNode('  Maximum: ');
		this.mainForm.appendChild(textnode);
		this.maxInput = document.createElement('input');
		this.maxInput.type = 'number';
		this.mainForm.appendChild(this.maxInput);
		//dropdown up/down/doesn't matter
		this.mainForm.appendChild(document.createElement('br'));
		textnode = document.createTextNode('  Direction of monotonicity:');
		this.mainForm.appendChild(textnode);
		this.upDownSelect = document.createElement('select');
		var choices = ['up','down',"doesn't matter"];
		for (var i = 0; i < choices.length; i++) {
			var newOption = document.createElement('option');
			newOption.innerHTML = choices[i];
			newOption.value = choices[i];
			this.upDownSelect.appendChild(newOption);
		}
		this.mainForm.appendChild(this.upDownSelect);
		// load images
		this.upIcon = new Image(30,30);
		this.upIcon.src = 'up.jpg';
		this.downIcon = new Image(30,30);
		this.downIcon.src = 'down.jpg';
		this.updownIcon = new Image(30,30);
		this.updownIcon.src = 'updown.jpg';
	}

	this.setupListeners = function() {
		var that = this;
		this.minInput.onchange = function(e) {
			that.xmin = Number(this.value);
			if (Number.isNaN(that.xmin))
				that.xmin = -Infinity;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.maxInput.onchange = function(e) {
			that.xmax = Number(this.value);
			if (Number.isNaN(that.xmax))
				that.xmax = Infinity;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}

		this.upDownSelect.onchange = function(e) {
			that.trend = this.value;
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}
	}

	this.getCriteria = function() {
		var data = {'type':'Monotonic'};
		if (this.xmax != Infinity || this.xmin != -Infinity) {
			data['domain'] = [this.xmin, this.xmax];
		}
		if (this.trend == 'up') {
			data['trend'] = 1;
		} else if (this.trend == 'down') {
			data['trend'] = -1;
		} else {
			data['trend'] = 0
		}
		return data;
	}


	this.isRelationshipPresent = function() {
		return true;
	}

	this.relationshipRange = function() {
		return [this.xmin, this.xmax];
	}

	this.relationshipIcon = function() {
		if (this.trend == 'up')
			return this.upIcon;
		else if (this.trend == 'down')
			return this.downIcon;
		else
			return this.updownIcon;
	}

	this.initialize();
	this.setupListeners();
}

// behaves like Linked List
function CritPoint(refDiv, prev, next) {
	var that = this;
	if (typeof(prev) === 'undefined') prev = null;
	if (typeof(next) === 'undefined') next = null;
	this.refDiv = refDiv;
	this.next = next;
	this.prev = prev;
	this.myDiv = null;
	this.xInput = null;
	this.yInput = null;
	this.pixelCloseness = null;
	this.addBeforeButton = null;
	this.addAfterButton = null;
	this.deleteButton = null;

	this.initialize = function() {
		var textnode;
		//place the div for this particular instance
		this.myDiv = document.createElement('div');
		if (this.next == null) {
			this.refDiv.appendChild(this.myDiv);
		} else {
			this.refDiv.insertBefore(this.myDiv, this.next.myDiv);
		}
		// 'put option before' button
		this.addBeforeButton = document.createElement('button');
		this.addBeforeButton.innerHTML = 'add';
		this.addBeforeButton.onclick = this.addOptionBefore;
		this.myDiv.appendChild(this.addBeforeButton);
		// xinput
		textnode = document.createTextNode("X: ");
		this.myDiv.appendChild(textnode);
		this.xInput = document.createElement('input');
		this.xInput.type = 'number';
		this.myDiv.appendChild(this.xInput);
		// yinput
		textnode = document.createTextNode('  Y: ');
		this.myDiv.appendChild(textnode);
		this.yInput = document.createElement('input');
		this.yInput.type = 'number';
		this.myDiv.appendChild(this.yInput);
		// pixel distance
		textnode = document.createTextNode('  pixel closeness: ');
		this.myDiv.appendChild(textnode);
		this.pixelCloseness = document.createElement('input');
		this.pixelCloseness.type = 'number';
		this.myDiv.appendChild(this.pixelCloseness);
		// 'put option after' button
		this.addAfterButton = document.createElement('button');
		this.addAfterButton.innerHTML = 'add';
		this.addAfterButton.onclick = this.addOptionAfter;
		this.myDiv.appendChild(this.addAfterButton);
		// delete button
		this.deleteButton = document.createElement('button');
		this.deleteButton.innerHTML = 'del';
		this.deleteButton.onclick = this.deleteNode;
		this.myDiv.appendChild(this.deleteButton);
	}

	this.addOptionBefore = function(e) {
		var origPrev = that.prev;
		that.prev = new CritPoint(that.refDiv, origPrev, that);
	}

	this.addOptionAfter = function(e) {
		var origNext = that.next;
		that.next = new CritPoint(that.refDiv, that, origNext);
	}

	this.deleteNode = function(e) {
		if (that.next == null && that.prev == null)
			return;
		// fix pointers
		if (that.prev != null)
			that.prev.next = that.next;
		if (that.next != null)
			that.next.prev = that.prev;
		// remove the div
		that.refDiv.removeChild(that.myDiv);
	}

	this.getChoices = function() {
		// find head
		var node = this;
		while (node.prev != null)
			node = node.prev;
		// iterate through to get all options
		var choices = [];
		while (node != null) {
			var obj = {};
			obj['x'] = node.xInput.value;
			obj['y'] = node.yInput.value;
			obj['pixelCloseness'] = node.pixelCloseness.value;
			choices.push(obj);
			node = node.next;
		}
		return choices;
	}
	this.initialize();
}
function CriticalPointCriteria(gradingOptions, refDiv) {
	BasicCriteria.call(this, gradingOptions, refDiv);

	this.critLinkedList = null;
	this.updateButton = null;
	
	this.initialize = function() {
		this.setHelpText("Ensure students draw through certain critical points");
		this.setTitleText("Critical Point Criteria");
		this.critLinkedList = new CritPoint(this.container);
		// update button
		this.updateButton = document.createElement('input');
		this.updateButton.type = 'button';
		this.updateButton.value = 'Update Visualizer';
		this.mainForm.appendChild(this.updateButton);
	}

	this.getCriticalPoints = function() {
		var list = this.critLinkedList.getChoices();
		var list2 = [];
		// check that all fields have been filled correctly
		for (var i = 0; i < list.length; i++) {
			var x = list[i].x == "" ? Number.NaN : Number(list[i].x);
			var y = list[i].x == "" ? Number.NaN : Number(list[i].y);
			var pc = list[i].pixelCloseness == "" ? Number.NaN : Number(list[i].pixelCloseness);
			if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(pc)) {
				continue
			}
			list2.push({'x':x, 'y':y, 'pixelCloseness':pc});
		}
		return list2;
	}

	this.setupListeners = function() {
		var that = this;
		this.updateButton.onclick = function(e) {
			that.gradingOptions.gradeInterface.gradeCanvas.draw();
		}
	}

	this.getCriteria = function() {
		var data = {'type':'Points'};
		data['list'] = this.getCriticalPoints();
		return data;
	}


	this.initialize();
	this.setupListeners();
}

function PythonCriteria(gradingOptions, refDiv) {
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
		console.log('ret1', ret.v);
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

Equation = new function(string) {
	var that = this;

	this.tokenize = function(string) {
		string = string.replace(/\s+/g, '');
		var tokens = [];
		var cur = '';
		for (var i = 0; i < string.length; i++) {
			var c = string.charAt(i);
			cur += c;
			if (!this.validPrefix(cur)) {
				if (cur.length == 1) {
					console.log('exiting1', tokens, cur);
					return null;
				} else {
					var type = this.tokenType(cur.slice(0,-1));
					tokens.push({'string':cur.slice(0,-1), 'type':type});
					cur = c;
					if (i != string.length - 1 && this.tokenType(cur) == 'invalid') {
						console.log('exiting2', tokens, cur);
						return null;
					}
				}
			}
			if (i == string.length-1) {
				if (this.tokenType(cur) == 'invalid') {
					console.log('exiting3', tokens, cur);
					return null;
				}
				var type = this.tokenType(cur);
				tokens.push({'string':cur, 'type':type});
			}
		}
		return tokens;
	}

	this.validPrefix = function(token) {
		var numberRe = /(\d+\.?\d*)|(\d*\.\d+)/g;
		var variableRe = /([a-z]|[A-Z]|_)([a-z]|[A-Z]|_|\d)*/g;
		var moduleRe = /([a-z]|[A-Z]|_)([a-z]|[A-Z]|_|\d)*\(?/g;
		var mathModuleRe1 = /(math\.)/g;
		var mathModuleRe2 = /(math\.)?([a-z]|[A-Z]|_)([a-z]|[A-Z]|_|\d)*\(?/g;
		var mathOperator = /\/|\*\*|\-|\+|\*/;
		var parentheses = /\(|\)/;
		var allRe = {
			'number':numberRe, 
			'variable':variableRe, 
			'module':moduleRe, 
			'math.1': mathModuleRe1,
			'math.2': mathModuleRe2,
			'op':mathOperator, 
			'parens':parentheses
		};

		for (var prop in allRe) {
			var m = token.match(allRe[prop]);
			if (m != null && m.length == 1 && m[0].length == token.length) {
				return true;
			}
		}
		return false;
	}

	this.tokenType = function(token) {
		// check if it's a number
		var numberRe = /(\d+\.?\d*)|(\d*\.\d+)/g;
		var variableRe = /([a-z]|[A-Z]|_)([a-z]|[A-Z]|_|\d)*/g;
		var moduleRe = /([a-z]|[A-Z]|_)([a-z]|[A-Z]|_|\d)*\(?/g;
		var mathModuleRe = /(math)?\.?([a-z]|[A-Z]|_)([a-z]|[A-Z]|_|\d)*\(?/g;
		var mathOperator = /\/|\*\*|\-|\+|\*/;
		var parentheses = /\(|\)/;
		var allRe = {
			'number':numberRe, 
			'variable':variableRe, 
			'module':moduleRe, 
			'math.': mathModuleRe,
			'op':mathOperator, 
			'parens':parentheses
		};

		for (var prop in allRe) {
			var m = token.match(allRe[prop]);
			if (m != null && m.length == 1 && m[0].length == token.length) {
				return prop;
			}
		}
		return 'invalid';
	}

	this.mathMapping = {
		'math.ceil(': Math.ceil,
		'math.fabs(': Math.abs,
		'math.abs(':Math.abs,
		'math.floor(': Math.floor,
		'math.exp(': Math.exp,
		'math.log(': Math.log,
		'math.sqrt(': Math.sqrt,
		'math.acos(': Math.acos,
		'math.asin(': Math.asin,
		'math.atan(': Math.atan,
		'math.cos(': Math.cos,
		'math.sin(': Math.sin,
		'math.tan(': Math.tan,
	};

	this.lazyEval = function(nested, environ) {
		// first lazy evaluate everything in parentheses
		for (var i = 0; i < nested.length; i++) {
			if (Object.prototype.toString.call(nested[i]) == "[object Array]") {
				nested[i] = this.lazyEval(nested[i], environ);
			}
		}

		var getLeft = function(i) {
			var left = null;
			if (nested[i-1].type == 'number') {
				left = Number(nested[i-1].string);
			} else if (nested[i-1].type == 'variable' && environ.hasOwnProperty(nested[i-1].string)) {
				left = Number(environ[nested[i-1].string]);
			}
			return left;
		};
		var getRight = function(i) {
			var right = null;
			if (nested[i+1].type == 'number') {
				right = Number(nested[i+1].string);
			} else if (nested[i+1].type == 'variable' && environ.hasOwnProperty(nested[i+1].string)) {
				right = Number(environ[nested[i+1].string]);
			}
			return right;
		};

		// look for module things
		for (var i = 0; i < nested.length; i++) {
			if (Object.prototype.toString.call(nested[i]) == "[object Array]") {
				// nested thing probably has variable inside
			} else if (nested[i].type == 'math.') {
				if (!this.mathMapping.hasOwnProperty(nested[i].string)) {
					console.log('math function not found');
					return;
				}
				var right = getRight(i);
				if (right == null) {
					// should not be evaluated right now so hide it in parentheses
					var parens = [nested[i], nested[i+1]];
					nested.splice(i, 2, parens);
				} else {
					var result = this.mathMapping[nested[i].string].call(null, right);
					nested.splice(i, 2, {'string':String(result), 'type':'number'})
				}
				i -= 1;
			}
		}

		// now look for exponentials
		for (var i = 0; i < nested.length; i++) {
			if (Object.prototype.toString.call(nested[i]) == "[object Array]") {
				// nested thing probably has variable inside
			} else if (nested[i].type == 'op' && nested[i].string == '**') {
				var left = getLeft(i);
				var right = getRight(i);
				if (left == null || right == null) {
					var parens = [nested[i-1], nested[i], nested[i+1]];
					nested.splice(i-1,3,parens);
				} else {
				nested.splice(i-1,3, {'string':String(Math.pow(left, right)), 'type':'number'});
				}
				i -= 2;
			}
		}

		// now look for division/multiplication
		for (var i = 0; i < nested.length; i++) {
			if (Object.prototype.toString.call(nested[i]) == "[object Array]") {
				// nested thing probably has variable inside
			} else if (nested[i].type == 'op' && (nested[i].string == '/' || nested[i].string == '*')) {
				var left = getLeft(i);
				var right = getRight(i);
				if (left == null || right == null) {
					var parens = [nested[i-1], nested[i], nested[i+1]];
					nested.splice(i-1,3,parens);
				} else {
					var result = (nested[i].string == '/') ? left/right : left*right;
					nested.splice(i-1,3, {'string':String(result), 'type':'number'});
				}
				i -= 2;
			}
		}

		// finally do addition/subtraction
		for (var i = 0; i < nested.length; i++) {
			if (Object.prototype.toString.call(nested[i]) == "[object Array]") {
				// nested thing probably has variable inside
			} else if (nested[i].type == 'op' && (nested[i].string == '-' || nested[i].string == '+')) {
				var left = getLeft(i);
				var right = getRight(i);
				if (left == null || right == null) {
					var parens = [nested[i-1], nested[i], nested[i+1]];
					nested.splice(i-1,3,parens);
				} else {
					var result = (nested[i].string == '-') ? left-right : left+right;
					nested.splice(i-1,3, {'string':String(result), 'type':'number'});
				}
				i -= 2;
			}
		}

		if (nested.length == 1)
			return nested[0];
		return nested;
	}

	this.deepCopyArray = function(array) {
		if (Object.prototype.toString.call(array) != "[object Array]")
			return array;
		var copy = [];
		for (var i = 0; i < array.length; i++) {
			if (Object.prototype.toString.call(array[i]) == "[object Array]") {
				copy.push(that.deepCopyArray(array[i]));
			} else {
				copy.push(array[i]);
			}
		}
		return copy;
	}

	// returns function into which parameters can be plugged in or null if input is invalid
	this.parseEquation = function(string) {
		var tokens = this.tokenize(string);
		if (tokens == null) {
			return null;
		}
		// redo list of tokens so that parentheses are shown as nested arrays
		// e.g. '3*(5+math.sin(5))' --> ['3','*',['5','+','math.sin',['5']]]
		var nested = [];
		var listsInUse = [nested];
		for (var i = 0; i < tokens.length; i++) {
			var tok = tokens[i];
			if (tok.type == 'parens' && tok.string == '(') {
				listsInUse.push([]);
			} else if (tok.type == 'math.' || tok.type == 'module') {
				listsInUse[listsInUse.length-1].push(tok);
				listsInUse.push([]);
			} else if (tok.type == 'parens' && tok.string == ')') {
				if (listsInUse.length == 1) {
					console.log('non matching parens', nested);
					return null;
				}
				listsInUse[listsInUse.length-2].push(listsInUse.pop());
			} else {
				listsInUse[listsInUse.length-1].push(tok);
			}
		}
		//lazy evaluation to minimize constant terms, do (P)EMDAS
		nested = this.lazyEval(nested, {});
		// environ is an object with variable names matched to numbers
		var func = function(environ) {
			var ans = that.lazyEval(that.deepCopyArray(nested), environ);
			if (Object.prototype.toString.call(ans) != "[object Array]" && ans.type == 'number') {
				return Number(ans.string);
			}
			return ans;
		};
		return func;
	}
}();


//test = Equation.parseEquation('math.sin(x)*2');
//console.log(test({x:2}));
