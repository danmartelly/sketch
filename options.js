function DisplayOptions(refDiv) {
	this.refDiv = refDiv;
	this.xAxisOptions = null;
	this.yAxisOptions = null;
	this.imageOptions = null;
	this.critPointOptions = null;
	this.funcOptions = null;
	this.sketchInterface = null;
	this.sketchDiv = null;
	this.previewButton = null;
	var that = this;

	this.initialize = function() {
		var div = document.createElement('div');
		var textnode;
		// xaxis
		textnode = document.createElement('h4');
		textnode.innerHTML = 'X axis';
		this.refDiv.appendChild(textnode);
		this.refDiv.appendChild(div);
		this.xAxisOptions = new AxisOptions(div);
		div = div.cloneNode();
		// yaxis
		textnode = document.createElement('h4');
		textnode.innerHTML = 'Y axis';
		this.refDiv.appendChild(textnode);
		this.refDiv.appendChild(div);
		this.yAxisOptions = new AxisOptions(div);
		div = div.cloneNode();
		//image
		textnode = document.createElement('h4');
		textnode.innerHTML = 'Background Image';
		this.refDiv.appendChild(textnode);
		this.refDiv.appendChild(div);
		this.imageOptions = new BackgroundImageOption(div);
		div = div.cloneNode();
		//critical points
		textnode = document.createElement('h4');
		textnode.innerHTML = 'Critical Points';
		this.refDiv.appendChild(textnode);
		this.refDiv.appendChild(div);
		this.critPointOptions = new CritPointOption(div);
		div = div.cloneNode();
		// functions
		textnode = document.createElement('h4');
		textnode.innerHTML = 'Function Criteria';
		this.refDiv.appendChild(textnode);
		this.refDiv.appendChild(div);
		this.funcOptions = new FunctionOption(div);
		div = div.cloneNode();
		// preview button
		var form = document.createElement('form');
		this.previewButton = document.createElement('input');
		this.previewButton.type = 'button';
		this.previewButton.value = 'Preview';
		this.previewButton.onclick = this.preview;
		form.appendChild(this.previewButton);
		this.refDiv.appendChild(form);
		// sketch interface
		textnode = document.createElement('h4');
		textnode.innerHTML = 'View';
		this.refDiv.appendChild(textnode);
		this.sketchDiv = div;
		this.refDiv.appendChild(this.sketchDiv);
		div = div.cloneNode();
		this.sketchInterface = new SketchInterface(this.sketchDiv);
	}

	this.getChoices = function() {
		options = {};
		options['xaxis'] = this.xAxisOptions.getChoices();
		options['yaxis'] = this.yAxisOptions.getChoices();
		options['img'] = this.imageOptions.getChoices();
		options['critPoints'] = this.critPointOptions.getChoices();
		options['functions'] = this.funcOptions.getChoices();
		return options
	}

	this.preview = function(e) {
		that.sketchInterface.updateOptions(that.getChoices());
	}

	this.mergeObjects = function(obj1, obj2, attrModifier1, attrModifier2) {
		if (typeof(attrModifier1) === 'undefined') attrModifier1 = function(attr) {
			return attr
		};
		if (typeof(attrModifier2) === 'undefined') attrModifier2 = function(attr) {
			return attr
		};
		var newObj = {};
		for (var attrname in obj1)
			newObj[attrname] = obj1[attrname];
		for (var attrname in obj2)
			newObj[attrname] = obj2[attrname];
		return options;
	}

	this.initialize();
}

function AxisOptions(refDiv) {
	this.refDiv = refDiv;
	this.form = null;
	this.pixelInput = null;
	this.logRadio = null;
	this.linearRadio = null;
	this.studentRadio = null;
	this.teacherRadio = null;
	this.extraDiv = null;
	this.minText = null;
	this.maxText = null;
	this.stepText = null;
	this.labelText = null;
	var that = this;

	this.initialize = function() {
		var textnode;
		var brk = document.createElement('br');
		// overall form
		this.form = document.createElement("form");
		this.refDiv.appendChild(this.form);
		// dimension in pixels
		textnode = document.createTextNode("Dimension in pixels: ");
		this.refDiv.appendChild(textnode);
		this.pixelInput = document.createElement('input');
		this.pixelInput.type = 'number';
		this.pixelInput.style['width'] = '50px';
		this.refDiv.appendChild(this.pixelInput);
		textnode = document.createTextNode(' px');
		this.refDiv.appendChild(textnode);

		// log or linear scale
		this.linearRadio = document.createElement('input');
		this.linearRadio.setAttribute('type', 'radio');
		this.linearRadio.setAttribute('name', 'scaleType');
		this.linearRadio.checked = true;
		this.form.appendChild(this.linearRadio);
		textnode = document.createTextNode("Linear scale");
		this.form.appendChild(textnode);
		this.logRadio = document.createElement('input');
		this.logRadio.setAttribute('type', 'radio');
		this.logRadio.setAttribute('name', 'scaleType');
		this.form.appendChild(this.logRadio);
		textnode = document.createTextNode("Log scale");
		this.form.appendChild(textnode);
		this.form.appendChild(brk.cloneNode());
		// axis set by student or teacher?
		this.teacherRadio = document.createElement('input');
		this.teacherRadio.setAttribute('type', 'radio');
		this.teacherRadio.setAttribute('name', 'setBy');
		this.teacherRadio.checked = true;
		this.teacherRadio.onchange = this.setByChange;
		this.form.appendChild(this.teacherRadio);
		textnode = document.createTextNode("Axis set by teacher");
		this.form.appendChild(textnode);
		this.studentRadio = document.createElement('input');
		this.studentRadio.setAttribute('type', 'radio');
		this.studentRadio.setAttribute('name', 'setBy');
		this.studentRadio.onchange = this.setByChange;
		this.form.appendChild(this.studentRadio);
		textnode = document.createTextNode("Axis set by student");
		this.form.appendChild(textnode);
		this.form.appendChild(brk.cloneNode())
		// min max step
		this.extraDiv = document.createElement('div');
		textnode = document.createTextNode("Min:");
		this.extraDiv.appendChild(textnode);
		this.minText = document.createElement('input');
		this.minText.setAttribute('type','number');
		this.minText.style['width'] = '50px';
		this.extraDiv.appendChild(this.minText);
		textnode = document.createTextNode(" Max:");
		this.extraDiv.appendChild(textnode);
		this.maxText = document.createElement('input');
		this.maxText.setAttribute('type','number');
		this.maxText.style['width'] = '50px';
		this.extraDiv.appendChild(this.maxText);
		textnode = document.createTextNode(" Step:");
		this.extraDiv.appendChild(textnode);
		this.stepText = document.createElement('input');
		this.stepText.setAttribute('type','number');
		this.stepText.style['width'] = '50px';	
		this.extraDiv.appendChild(this.stepText);
		this.extraDiv.appendChild(brk.cloneNode());
		this.form.appendChild(this.extraDiv);
		// desired label
		textnode = document.createTextNode	("X axis label: ");
		this.form.appendChild(textnode);
		this.labelText = document.createElement('input');
		this.form.appendChild(this.labelText);
	}

	this.setByChange = function(e) {
		if (that.teacherRadio.checked)
			that.extraDiv.style.visibility = 'visible';
		else
			that.extraDiv.style.visibility = 'collapse';
	}

	this.getChoices = function() {
		var options = {};
		if (this.linearRadio.checked)
			options['scaleType'] = 'linear';
		else
			options['scaleType'] = 'log'
		if (this.teacherRadio.checked) {
			options['setBy'] = 'teacher';
			options['min'] = this.minText.value;
			options['max'] = this.maxText.value;
			options['step'] = this.stepText.value;
		} else
			options['setBy'] = 'student';
		options['label'] = this.labelText.value;
		options['pixelDim'] = this.pixelInput.value;
		return options
	}

	this.initialize();
}

// behaves like Linked List
// prev and next should be FunctionOption instances
function FunctionOption(refDiv, prev, next) {
	var that = this;
	if (typeof(prev) === 'undefined') prev = null;
	if (typeof(next) === 'undefined') next = null;
	this.refDiv = refDiv;
	this.next = next;
	this.prev = prev;
	this.myDiv = null;
	this.functionText = null;
	this.domainMinText = null;
	this.domainMaxText = null;
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
		// 'put function before' button
		this.addBeforeButton = document.createElement('button');
		this.addBeforeButton.innerHTML = 'add';
		this.addBeforeButton.onclick = this.addOptionBefore;
		this.myDiv.appendChild(this.addBeforeButton);
		// put function text box
		textnode = document.createTextNode(" y = ");
		this.myDiv.appendChild(textnode);
		this.functionText = document.createElement('input');
		this.myDiv.appendChild(this.functionText);
		// domain min
		textnode = document.createTextNode(" Domain min: ");
		this.myDiv.appendChild(textnode);
		this.domainMinText = document.createElement('input');
		this.domainMinText.type = 'number';
		this.domainMinText.style['width'] = '50px';
		this.myDiv.appendChild(this.domainMinText);
		//domain max
		textnode = document.createTextNode(" Domain max: ");
		this.myDiv.appendChild(textnode);
		this.domainMaxText = document.createElement('input');
		this.domainMaxText.type = 'number';
		this.domainMaxText.style['width'] = '50px';
		this.myDiv.appendChild(this.domainMaxText);
		// 'put function after' button
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
		that.prev = new FunctionOption(that.refDiv, origPrev, that);
	}

	this.addOptionAfter = function(e) {
		var origNext = that.next;
		that.next = new FunctionOption(that.refDiv, that, origNext);
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
		return {};
	}

	this.initialize();
}

// behaves like Linked List
// prev and next should be CritPointOption instances
function CritPointOption(refDiv, prev, next) {
	var that = this;
	if (typeof(prev) === 'undefined') prev = null;
	if (typeof(next) === 'undefined') next = null;
	this.refDiv = refDiv;
	this.next = next;
	this.prev = prev;
	this.myDiv = null;
	this.labelText = null;
	this.mandatoryCheckbox = null;
	this.maxUsesText = null;
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
		// put label text box
		textnode = document.createTextNode(" Critical Point Label: ");
		this.myDiv.appendChild(textnode);
		this.labelText = document.createElement('input');
		this.myDiv.appendChild(this.labelText);
		// mandatory?
		this.mandatoryCheckbox = document.createElement('input');
		this.mandatoryCheckbox.type = 'checkbox';
		this.myDiv.appendChild(this.mandatoryCheckbox);
		textnode = document.createTextNode('Mandatory ');
		// max uses
		textnode = document.createTextNode('Max uses: ');
		this.myDiv.appendChild(textnode);
		this.maxUsesText = document.createElement('input');
		this.maxUsesText.type = 'number';
		this.maxUsesText.style['width'] = '50px';
		this.myDiv.appendChild(this.maxUsesText);
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
		that.prev = new CritPointOption(that.refDiv, origPrev, that);
	}

	this.addOptionAfter = function(e) {
		var origNext = that.next;
		that.next = new CritPointOption(that.refDiv, that, origNext);
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
		return {};
	}

	this.initialize();
}

function BackgroundImageOption(refDiv) {
	this.refDiv = refDiv;
	this.uploadSelect = null;
	this.xscale = null;
	this.xoffset = null;
	this.yscale = null;
	this.yoffset = null;
	this.imgsrc = '';

	this.initialize = function() {
		var textnode;
		var brk = document.createElement('br');
		// src image select
		this.uploadSelect = document.createElement('input');
		this.uploadSelect.type = 'file';
		this.refDiv.appendChild(this.uploadSelect);
		this.uploadSelect.addEventListener('change', this.handleImage, false);
		this.refDiv.appendChild(brk.cloneNode());
		// x scale
		textnode = document.createTextNode("X scale: ");
		this.refDiv.appendChild(textnode);
		this.xscale = document.createElement('input');
		this.xscale.type = 'number';
		this.refDiv.appendChild(this.xscale);
		this.refDiv.appendChild(brk.cloneNode());
		// x offset
		textnode = document.createTextNode("X offset: ");
		this.refDiv.appendChild(textnode);
		this.xoffset = document.createElement('input');
		this.xoffset.type = 'number';
		this.refDiv.appendChild(this.xoffset);
		this.refDiv.appendChild(brk.cloneNode());
		// y scale
		textnode = document.createTextNode("Y scale: ");
		this.refDiv.appendChild(textnode);
		this.yscale = document.createElement('input');
		this.yscale.type = 'number';
		this.refDiv.appendChild(this.yscale);
		this.refDiv.appendChild(brk.cloneNode());
		// y offset
		textnode = document.createTextNode("Y offset: ");
		this.refDiv.appendChild(textnode);
		this.yoffset = document.createElement('input');
		this.yoffset.type = 'number';
		this.refDiv.appendChild(this.yoffset);
		this.refDiv.appendChild(brk.cloneNode());
	}

	var that = this;
	this.handleImage = function(e) {
		var canvas = document.getElementById('testCanvas');
		var ctx = canvas.getContext('2d');
		var reader = new FileReader();
		reader.onload = function(event) {
			that.imgsrc = event.target.result;
		}
		reader.readAsDataURL(e.target.files[0]);
	}

	this.getChoices = function() {
		var options = {};
		options['xscale'] = this.xscale.value;
		options['xoffset'] = this.xoffset.value;
		options['yscale'] = this.yscale.value;
		options['yoffset'] = this.yoffset.value;
		options['imgsrc'] = this.imgsrc;
		return options;
	}

	this.initialize();
}

