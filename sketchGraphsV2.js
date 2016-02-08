/*
Parts of the sketch interface
Canvases:
- Axes label + numbers
- Axis lines
- Guideline canvas
- Answer submission canvas
Form:
- Tools
- Submission
*/

var defaultOptions = {
			'tutor' : false,
			'xaxis' : {
				'label': "xaxis",
				'max': "2",
				'min': "-2",
				'step': "1",
				'setBy': 'teacher',
				'scaleType': 'linear', 
				'pixelDim' : 500
			}, 'yaxis' : {
				'label': "yaxis",
				'max': "2",
				'min': "-2",
				'step': "2",
				'setBy': 'teacher',
				'scaleType': 'linear',
				'pixelDim' : 300
			}, 'img' : {
				'imgsrc' : '',
				'xoffset' : 0,
				'xscale' : 1,
				'yoffset' : 0,
				'yscale' : 1
			}, 'critPoints' : []
			, 'otherFeatures' : [] // quite hacky at the moment
		};

function SketchInterface(refDiv, options) {
	this.options = typeof options !== 'undefined' ? options : {};
	this.refDiv = refDiv;
	this.toolbarDiv = null;
	this.width = 10;
	this.height = 10;
	this.recording = [];
	this.kerberosHash = null;
	this.studentDataLoaded = false;
	this.problemID = null;
	this.problemDataLoaded = false;

	// criticalPoint object should look like the following:
	// {'label':'blah', 'mandatory':true, 'max uses':1}

	this.initialize = function() {
		this.fillOptions(this.options, defaultOptions);
		var that = this;
		this.refDiv.style.position = 'relative';
		//canvases
		this.xAxis = new XAxis(that, this.refDiv, this.width);
		this.yAxis = new YAxis(that, this.refDiv, this.height);
		this.imageCanvas = new ImageCanvas(that, this.refDiv, this.width, this.height);
		this.axisLineCanvas = new AxisLineCanvas(that, this.refDiv, this.width, this.height);
		this.drawingCanvas = new DrawingCanvas(that, this.refDiv, this.width, this.height, true, true);
		this.criticalPointCanvas = new CriticalPointCanvas(that, this.refDiv, this.width, this.height);
		this.criticalPointCanvas.setMouseEventReceiver(this.drawingCanvas.canvas);
		// toolbars
		this.toolbarDiv = document.createElement('div');
		this.toolbarDiv.style.position = 'absolute';
		this.refDiv.appendChild(this.toolbarDiv);
		this.drawingToolbar = new DrawingToolbar(that, this.toolbarDiv);
		this.setXToolbar = new setAxisToolbar(that, this.toolbarDiv, true);
		this.setYToolbar = new setAxisToolbar(that, this.toolbarDiv, false);
		this.criticalPointToolbar = new CriticalPointToolbar(that, this.toolbarDiv);
		this.submitToolbar = new SubmitToolbar(that, this.toolbarDiv);
		// special hidden bar
		this.hiddenData = new HiddenData(that, this.refDiv);

		this.processOptions();
	}

	this.setKerberosHash = function(kerberosHash) {
		this.kerberosHash = kerberosHash;
		if (this.kerberosHash != null && this.problemID != null)
			this.getStudentData();
	}

	this.setProblemID = function(problemID) {
		this.problemID = problemID;
		this.getProblemOptions(problemID);
		if (this.kerberosHash != null && this.problemID != null) {
			this.getStudentData();
		}
	}

	this.updateOptions = function(newOptions) {
		this.options = newOptions;
		this.fillOptions(this.options, defaultOptions);
		this.processOptions();
	}

	// fill in defaults in options object in place
	this.fillOptions = function(obj, defaultObj) {
		for (var attrname in defaultObj) {
			if (!(attrname in obj)) {
				obj[attrname] = defaultObj[attrname];
			} else {
				// if default is an object and the other isn't, bad configuration
				if (typeof(defaultObj[attrname]) === 'object' && typeof(obj[attrname]) !== 'object') {
					console.log('attrname not configured correctly', attrname, obj);
				// if both are objects, recurse
				} else if (typeof(defaultObj[attrname]) === 'object') {
					this.fillOptions(obj[attrname], defaultObj[attrname]);
				}
			}
		}
	}

	this.processOptions = function() {
		this.width = Number(this.options['xaxis']['pixelDim']);
		this.height = Number(this.options['yaxis']['pixelDim']);
		// resizing
		this.axisLineCanvas.reposition(80,0);
		this.axisLineCanvas.resize(this.width, this.height);
		this.drawingCanvas.reposition(80, 0);
		this.drawingCanvas.resize(this.width, this.height);
		this.imageCanvas.reposition(80, 0);
		this.imageCanvas.resize(this.width, this.height);
		this.criticalPointCanvas.resize(this.width, this.height);
		this.criticalPointCanvas.reposition(80, 0);
		this.xAxis.reposition(80, this.height);
		this.xAxis.resize(this.width);
		this.yAxis.resize(this.height);

		this.toolbarDiv.style.left = String(40) + 'px';
		this.toolbarDiv.style.top = String(this.height + 50) + 'px';
		// process axes
		var op = this.options['xaxis'];
		this.setXAxis(Number(op['min']),Number(op['max']),Number(op['step']));
		this.xAxis.setLabel(op['label']);
		op = this.options['yaxis'];
		this.setYAxis(Number(op['min']),Number(op['max']),Number(op['step']));
		this.yAxis.setLabel(op['label']);
		this.axisLineCanvas.setFeatures(this.options['otherFeatures']);
		// process image
		op = this.options['img'];
		this.imageCanvas.setImageSource(op['imgsrc'])
		this.imageCanvas.setOffset(Number(op['xoffset']), Number(op['yoffset']));
		this.imageCanvas.setScale(Number(op['xscale']), Number(op['yscale']));

		// toolbars
		var tbs = [this.setXToolbar, this.setYToolbar, this.criticalPointToolbar];
		for (var i = 0; i < tbs.length; i++) {
			tbs[i].removeSelf();
		}
		if (this.options['xaxis']['setBy'] == 'student') {
			this.setXToolbar.addSelf();
		}
		if (this.options['yaxis']['setBy'] == 'student') {
			this.setYToolbar.addSelf();
		}
		if (this.options['critPoints'].length > 0) {
			this.criticalPointToolbar.addSelf();
			this.criticalPointCanvas.enable();
			this.criticalPointCanvas.addPoints(this.options['critPoints']);
		} else {
			this.criticalPointCanvas.disable();
		}
		if (this.options['tutor']) {
			this.submitToolbar.removeSelf();
		} else {
			this.submitToolbar.addSelf();
		}
		this.refDiv.style.width = String(this.width + 100) + "px";
		this.refDiv.style.height = String(this.height + this.toolbarDiv.offsetHeight + 100) + "px";
	}

	this.getProblemOptions = function(probID) {
		var that = this;
		var request = {'request':'getOptions', 'problemID':probID};
		$.post('receiveData.py', request).done(
			function(data, status){
				var options = JSON.parse(data);
				that.updateOptions(options);
				that.problemDataLoaded = true;
				console.log('loaded problem options');
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
			});
	}

	this.getStudentData = function() {
		var that = this;
		var request = {'request':'getStudentData', 'problemID':this.problemID,
			'kerberosHash':this.kerberosHash};
		
		$.post('receiveData.py', request).done(
			function(data, status){
			var id;
			id = setInterval(function() {
				if (!that.problemDataLoaded) {
					console.log('waiting for problem data');
					return;
				}
				that.processStudentData(data);
				clearInterval(id);
			}, 500);
			
				that.processStudentData(data);
				console.log('loaded student\'s data');
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
			});
	}

	this.processStudentData = function(data) {
		this.hiddenData.value(data);
		data = JSON.parse(data);
		if (Object.keys(data).length == 0) {
			console.log('no saved student data yet');
			this.studentDataLoaded = true;
			return;
		}
		var id;
		//axes
		if (this.options['xaxis']['setBy'] == 'student') {
			var xAxis = data.axes.xaxis;
			this.setXAxis(xAxis.min, xAxis.max, xAxis.step);
		}
		if (this.options['yaxis']['setBy'] == 'student') {
			var yAxis = data.axes.yaxis;
			this.setYAxis(yAxis.min, yAxis.max, yAxis.step);
		}
		//drawing
		this.drawingCanvas.loadData(data.drawing);
		//critical points
		this.criticalPointCanvas.loadData(data.criticalPoints);
		//recording
		this.recording = data.recording;
		this.studentDataLoaded = true;
	}

	this.setXAxis = function(xmin, xmax, xstep) {
		var prevXMin = Number(this.xAxis.min), prevXMax = Number(this.xAxis.max);
		var newXMin = Number(xmin), newXMax = Number(xmax);
		var ymin = Number(this.yAxis.min), ymax = Number(this.yAxis.max);
		this.xAxis.setAxis(xmin, xmax, xstep);
		this.axisLineCanvas.setXAxis(xmin, xmax, xstep);
		if (prevXMin == null || prevXMax == null || newXMin == null || newXMax == null || ymin == null || ymax == null)
			return;
		this.drawingCanvas.changeAxis(prevXMin, prevXMax, ymin, ymax, newXMin, newXMax, ymin, ymax);
	}

	this.setYAxis = function(ymin, ymax, ystep) {
		var prevYMin = Number(this.yAxis.min), prevYMax = Number(this.yAxis.max);
		var newYMin = Number(ymin), newYMax = Number(ymax);
		var xmin = Number(this.xAxis.min), xmax = Number(this.xAxis.max);

		this.yAxis.setAxis(ymin, ymax, ystep);
		this.axisLineCanvas.setYAxis(ymin, ymax, ystep);
		if (prevYMin == null || prevYMax == null || newYMin == null || newYMax == null || xmin == null || xmax == null)
			return;
		this.drawingCanvas.changeAxis(xmin, xmax, prevYMin, prevYMax, xmin, xmax, newYMin, newYMax);

	}

	this.handleImage = function(e) {
		this.imageCanvas.handleImage(e);
	}

	this.getRecording = function(kerberosHash) {
		var that = this;
		var data = {'request':'getStudentRecording', 
			'kerberosHash':kerberosHash, 'problemID':this.problemID};
		$.post('receiveData.py', data).done(
			function(data, status){
				//data = JSON.parse(data);
				console.log(status, data);
				data = JSON.parse(data);
				that.playRecording(data);
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
			});
	}

	this.playRecording = function(recording) {
		var that = this;
		console.log('playing recording');
		var i = 0;
		var id;
		id = setInterval(function() {
			var cur = recording[i];
			if (cur.layer == 'drawing') {
				that.drawingCanvas.doRecordAction(cur);
			} else if (cur.layer == 'submit') {
				console.log('submit happened');
			} else if (cur.layer == 'criticalPoint') {
				console.log('critical happened');
			} else if (cur.layer == 'axes') {
				console.log('axes happened');
			}
			i++;
			if (i >= recording.length)
				clearInterval(id);
		}, 100);
	}

	this.initialize();
}

function HiddenData(sketchInterface, refDiv) {
	this.refDiv = refDiv;
	this.sketchInterface = sketchInterface;
	this.text = null;
	
	this.initialize = function() {
		this.text = document.createElement('input');
		this.refDiv.appendChild(this.text);
		this.text.type = 'hidden';
	}

	this.setID = function(id) {
		this.text.id = id;
		this.text.name = id;
	}

	this.value = function(value) {
		if (typeof value === 'undefined') {
			return this.text.value;
		}
		this.text.value = value;
	}

	this.update = function() {
		console.log('updating');
		var axisSave = this.sketchInterface.axisLineCanvas.getSaveData();
		var drawingSave = this.sketchInterface.drawingCanvas.getSaveData();
		var criticalSave = this.sketchInterface.criticalPointCanvas.getSaveData();
		var recording = this.sketchInterface.recording;
		var data = {'axes':axisSave, 'drawing':drawingSave, 
			'criticalPoints':criticalSave, 'recording':recording};
		this.value(JSON.stringify(data));

	}

	this.initialize();
}

function BasicFormToolbar(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	this.refDiv = refDiv;
	this.mainForm = null;

	this.initialize = function() {
		this.mainForm = document.createElement('form');
		//this.mainForm.style.position = 'absolute';
		this.refDiv.appendChild(this.mainForm);
	}

	this.removeSelf = function() {
		if (this.mainForm.parentElement != null)
			this.refDiv.removeChild(this.mainForm);
	}

	this.addSelf = function(refDiv) {
		if (refDiv != null && refDiv != undefined) {
			this.refDiv = refDiv;
		}
		this.refDiv.appendChild(this.mainForm);
	}

	this.reposition = function(x, y) {
		this.mainForm.style.left = String(x) + "px";
		this.mainForm.style.top = String(y) + "px";
	}

	this.initialize();
}

function DrawingToolbar(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.pencilRadio = null;
	this.eraserRadio = null;
	this.clearButton = null;

	this.initialize = function() {
		this.pencilRadio = document.createElement('input');
		this.pencilRadio.type = 'radio';
		this.pencilRadio.name = 'tool';
		this.pencilRadio.checked = true;
		this.mainForm.appendChild(this.pencilRadio);
		var pencilLabel = document.createElement('label');
		pencilLabel.innerHTML = 'Pencil';
		this.mainForm.appendChild(pencilLabel);

		this.eraserRadio = document.createElement('input');
		this.eraserRadio.type = 'radio';
		this.eraserRadio.name = 'tool';
		this.mainForm.appendChild(this.eraserRadio);
		var eraserLabel = document.createElement('label');
		eraserLabel.innerHTML = 'Eraser ';
		this.mainForm.appendChild(eraserLabel);

		this.clearButton = document.createElement('input');
		this.clearButton.type = 'button';
		this.clearButton.value = 'Clear Drawing';
		this.mainForm.appendChild(this.clearButton);
	}

	this.setupListeners = function() {
		var that = this;
		this.pencilRadio.onclick = function(e) {
			that.sketchInterface.drawingCanvas.mode = SKETCH_MODE;
		}

		this.eraserRadio.onclick = function(e) {
			that.sketchInterface.drawingCanvas.mode = ERASE_MODE;
		}

		this.clearButton.onclick = function(e) {
			that.sketchInterface.drawingCanvas.clearDrawing();
			that.sketchInterface.recording.push({
				'layer':'drawing',
				'event':'reset',
				'time':new Date().getTime()
			});
		}
	}

	this.initialize();
	this.setupListeners();
}

function SubmitToolbar(sketchInterface, refDiv) {
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.submitButton = null;
	this.loadingImage = null;
	this.toggleAnswer = null;
	this.feedbackDiv = null;

	this.initialize = function() {
		this.submitButton = document.createElement('input');
		this.submitButton.type = 'button';
		this.submitButton.value = 'Submit';
		//this.submitButton.disabled = true;
		this.mainForm.appendChild(this.submitButton);

		this.loadingImage = new Image();
		this.loadingImage.src = 'redx.png';
		this.loadingImage.style.display = 'none';
		this.mainForm.appendChild(this.loadingImage);

		this.toggleAnswer = document.createElement('input');
		this.toggleAnswer.type = 'button';
		this.toggleAnswer.value = 'Show Answer';
		this.mainForm.appendChild(this.toggleAnswer);

		this.feedbackDiv = document.createElement('div');
		this.feedbackDiv.innerHTML = 'feedback in here';
		this.mainForm.appendChild(this.feedbackDiv);
	}

	this.setupListeners = function() {
		var that = this;
		this.submitButton.onclick = function(e) {
			that.sketchInterface.recording.push({
				'layer':'submit',
				'event':'submit',
				'time':new Date().getTime()
			});

			/*var axisSave = that.sketchInterface.axisLineCanvas.getSaveData();
			var drawingSave = that.sketchInterface.drawingCanvas.getSaveData();
			var criticalSave = that.sketchInterface.criticalPointCanvas.getSaveData();
			var recording = that.sketchInterface.recording;
			var data =  {
				request: 'submitStudentData',
				kerberosHash: that.sketchInterface.kerberosHash,
				problemID: that.sketchInterface.problemID,
				saveData: JSON.stringify({'axes':axisSave,
					 'drawing':drawingSave,	'criticalPoints':criticalSave}),
				recording: JSON.stringify(recording)
			};*/
			var data =  {
				request: 'submitStudentData',
				kerberosHash: that.sketchInterface.kerberosHash,
				problemID: that.sketchInterface.problemID,
				saveData: that.sketchInterface.hiddenData.value()
			};

			that.loadingImage.style.display = 'inline';
			$.post('sendData.py', data).done(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
				data = JSON.parse(data);
				that.setFeedback(data['grade'], data['feedback']);
				that.loadingImage.style.display = 'none';
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
			});
		}
	}

	this.setFeedback = function(grade, textList) {
		var t = String(grade) + '% ';
                for (var i = 0; i < textList.length; i++) {
			t += String(textList[i]);
		}
		this.feedbackDiv.innerHTML = t;
	}

	this.initialize();
	this.setupListeners();
}

function setAxisToolbar(sketchInterface, refDiv, isXAxis) {
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.isXAxis = isXAxis;
	this.minBox = null;
	this.maxBox = null;
	this.stepBox = null;
	this.setButton = null;

	this.initialize = function() {
		var textWidth = "45px";
		var text = 'Y Axis';
		if (this.isXAxis)
			text = 'X Axis';
		var textnode = document.createTextNode(text);
		this.mainForm.appendChild(textnode);
		// min
		textnode = document.createTextNode('  Min:');
		this.mainForm.appendChild(textnode);
		this.minBox = document.createElement('input');
		this.minBox.type = 'number';
		this.minBox.style.width = textWidth;
		this.mainForm.appendChild(this.minBox);
		// max
		textnode = document.createTextNode('  Max:');
		this.mainForm.appendChild(textnode);
		this.maxBox = document.createElement('input');
		this.maxBox.type = 'number';
		this.maxBox.style.width = textWidth;
		this.mainForm.appendChild(this.maxBox);
		// step
		textnode = document.createTextNode('  Step:');
		this.mainForm.appendChild(textnode);
		this.stepBox = document.createElement('input');
		this.stepBox.type = 'number';
		this.stepBox.style.width = textWidth;
		this.mainForm.appendChild(this.stepBox);
		// set button
		this.setButton = document.createElement('input');
		this.setButton.type = 'button';
		this.setButton.value = 'Set axis';
		this.mainForm.appendChild(this.setButton);
	}

	this.setupListeners = function() {
		var that = this;
		this.setButton.onclick = function(e) {
			var min = that.minBox.value;
			var max = that.maxBox.value;
			var step = that.stepBox.value;
			if (that.isXAxis) {
				that.sketchInterface.setXAxis(min, max, step);
			} else {
				that.sketchInterface.setYAxis(min, max, step);
			}
			that.sketchInterface.recording.push({
				'layer':'axes',
				'event':'change',
				'min':min,
				'max':max,
				'step':step,
				'isXAxis':that.isXAxis,
				'time':new Date().getTime()
			});
		};
	}

	this.initialize();
	this.setupListeners();
}

function CriticalPointToolbar(sketchInterface, refDiv) {
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.resetButton = null;
	this.viewCheckbox = null;
	this.fixPointsCheckbox = null;

	this.initialize = function() {
		// reset button
		this.resetButton = document.createElement('input');
		this.resetButton.type = 'button';
		this.resetButton.value = 'Reset Critical Points';
		this.mainForm.appendChild(this.resetButton);
		// view toggle
		this.viewCheckbox = document.createElement('input');
		this.viewCheckbox.type = 'checkbox';
		this.mainForm.appendChild(this.viewCheckbox);
		var label = document.createElement('label');
		label.innerHTML = 'Minimize Labels';
		this.mainForm.appendChild(label);
		// fixed points toggle
		this.fixPointsCheckbox = document.createElement('input');
		this.fixPointsCheckbox.type = 'checkbox';
		this.mainForm.appendChild(this.fixPointsCheckbox);
		label = document.createElement('label');
		label.innerHTML = 'Fix Points';
		this.mainForm.appendChild(label);
	}

	this.setupListeners = function() {
		var that = this;
		this.resetButton.onclick = function(e) {
			that.sketchInterface.criticalPointCanvas.reset();
			that.sketchInterface.recording.push({
				'layer':'criticalPoint',
				'event':'reset',
				'time':new Date().getTime()
			});

		}

		this.viewCheckbox.onclick = function(e) {
			if (this.checked) {
				that.sketchInterface.criticalPointCanvas.setSmallLabels();
			} else {
				that.sketchInterface.criticalPointCanvas.setBigLabels();
			}
		}

		this.fixPointsCheckbox.onclick = function(e) {
			if (this.checked) {
				that.sketchInterface.criticalPointCanvas.disable();
			} else {
				that.sketchInterface.criticalPointCanvas.enable();
			}
		}
	}

	this.initialize();
	this.setupListeners();
}

function BasicCanvas(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	this.refDiv = refDiv;
	this.color = [0,0,0,256];

	this.initialize = function() {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.canvas.style.position = 'absolute';
		this.refDiv.appendChild(this.canvas);
	}

	this.resize = function(width, height) {
		this.width = width;
		this.height = height;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.draw();
	}

	this.reposition = function(x, y) {
		this.canvas.style.left = String(x) + "px";
		this.canvas.style.top = String(y) + "px";
	}

	this.clearCanvas = function() {
		var ctx = this.canvas.getContext('2d');
		ctx.clearRect(0,0,this.width, this.height);
	}

	this.setPixel = function(x,y,r,g,b,a) {
		r = typeof r !== 'undefined' ? r : this.color[0];
		g = typeof g !== 'undefined' ? g : this.color[1];
		b = typeof b !== 'undefined' ? b : this.color[2];
		a = typeof a !== 'undefined' ? a : this.color[3];
		var ctx = this.canvas.getContext('2d');
		var id = ctx.createImageData(1,1);
		var d = id.data;
		d[0] = r; d[1] = g; d[2] = b; d[3] = a;
		ctx.putImageData(id, x, y);
	}

	this.drawVerticalLine = function(x,r,g,b,a) {
		r = typeof r !== 'undefined' ? r : this.color[0];
		g = typeof g !== 'undefined' ? g : this.color[1];
		b = typeof b !== 'undefined' ? b : this.color[2];
		a = typeof a !== 'undefined' ? a : this.color[3];
		var ctx = this.canvas.getContext('2d');
		var id = ctx.createImageData(1,this.height);
		var d = id.data;
		for (var i = 0; i < d.length; i+=4) {
			d[i] = r; 
			d[i+1] = g;	
			d[i+2] = b; 
			d[i+3] = a;
		}
		ctx.putImageData(id, x, 0);
	}

	this.drawHorizontalLine = function(y,r,g,b,a) {
		r = typeof r !== 'undefined' ? r : this.color[0];
		g = typeof g !== 'undefined' ? g : this.color[1];
		b = typeof b !== 'undefined' ? b : this.color[2];
		a = typeof a !== 'undefined' ? a : this.color[3];
		var ctx = this.canvas.getContext('2d');
		var id = ctx.createImageData(this.width,1);
		var d = id.data;
		for (var i = 0; i < d.length; i+=4) {
			d[i] = r; 
			d[i+1] = g;	
			d[i+2] = b; 
			d[i+3] = a;
		}
		ctx.putImageData(id, 0, y);
	}

	this.draw = function() {
		console.log('draw is not overridden yet', this);
	}

	this.initialize();
}

function BasicAxis(sketchInterface, refDiv, label) {
	this.min = null;
	this.max = null;
	this.step = null;
	this.label = typeof label !== 'undefined' ? label : '';
	BasicCanvas.call(this, sketchInterface, refDiv);

	this.setLabel = function(newLabel) {
		this.label = newLabel;
		this.draw();
	}

	this.setAxis = function(min, max, step) {
		if (max < min)
			return;
		this.min = min; this.max = max; this.step = step;
		this.draw();
	}
}

function XAxis(sketchInterface, refDiv, width, label) {
	this.width = typeof width !== 'undefined' ? width : 10;
	this.height = 40;
	BasicAxis.call(this, sketchInterface, refDiv, label);

	this.resize = function(width) {
		this.width = width;
		this.height = 40;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.draw();
	}

	this.indexFromX = function(x) {
		if (typeof(this.min) != 'number' && typeof(this.max) != 'number')
			return null;
		return (x - this.min)/(this.max-this.min)*this.width;
	}

	this.xFromIndex = function(i) {
		if (typeof(this.min) != 'number' && typeof(this.max) != 'number')
			return null;
		return (i/this.width)*(this.max-this.min) + this.min;
	}

	this.drawNum = function(canvasX, number) {
		var fontSize = 12;
		var decimalPlaces = Math.ceil(Math.log(this.ystep)/Math.log(10));
		if (decimalPlaces < 0) {
			decimalPlaces = -Math.floor(decimalPlaces) + 2;
		} else {
			decimalPlaces = 2;
		}
		decimalPlaces = Math.max(Math.min(decimalPlaces, 19), 1);
		var ctx = this.canvas.getContext('2d');
		ctx.font = String(fontSize) + "px serif";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'hanging';
		ctx.fillText(parseFloat(number).toFixed(decimalPlaces), canvasX, 5);
	}

	this.drawNumbers = function() {
		if (this.min == null || this.max == null || this.step == null)
			return;
		var w = this.width;
		var cStep = w/((this.max-this.min)/this.step);
		var cOrigin = -this.min*w/(this.max-this.min);
		var x;
		var start;
		if (cOrigin > 1 && cOrigin < w-1) {
			start = cOrigin;
		} else {
			//choose a reasonable start (which also affects axis labeling)
			start = 0
		}
		for (x = start + cStep; x < w; x += cStep) {
			this.drawNum(Math.round(x), (x-cOrigin)/cStep*this.step);
		}
		for (x = start; x > 0; x -= cStep) {
			this.drawNum(Math.round(x), (x-cOrigin)/cStep*this.step);
		}
	}

	this.drawLabel = function() {
		if (this.label == '' || this.label == null)
			return;
		var fontSize = 14;
		var ctx = this.canvas.getContext('2d');
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.font = String(fontSize) + "px serif";
		ctx.fillText(this.label, this.width/2, this.height);
	}

	this.draw = function() {
		this.clearCanvas()
		this.drawNumbers();
		this.drawLabel();
	}
}

function YAxis(sketchInterface, refDiv, height, label) {
	this.height = typeof height !== 'undefined' ? height : 10;
	this.width = 80;
	BasicAxis.call(this, sketchInterface, refDiv);

	this.resize = function(height) {
		this.width = 80;
		this.height = height;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.draw();
	}

	this.indexFromY = function(y) {
		if (typeof(this.min) != 'number' && typeof(this.max) != 'number')
			return null;
		return (this.max - y)/(this.max-this.min)*this.height;
	}

	this.yFromIndex = function(j) {
		if (typeof(this.min) != 'number' && typeof(this.max) != 'number')
			return null;
		return this.max - (j/this.height)*(this.max-this.min);
	}

	this.drawNum = function(canvasY, number) {
		var fontSize = 12;
		var decimalPlaces = Math.ceil(Math.log(this.ystep)/Math.log(10));
		if (decimalPlaces < 0) {
			decimalPlaces = -Math.floor(decimalPlaces) + 2;
		} else {
			decimalPlaces = 2;
		}
		decimalPlaces = Math.max(Math.min(decimalPlaces, 19), 1);
		var ctx = this.canvas.getContext('2d');
		ctx.font = String(fontSize) + "px serif";
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		ctx.fillText(parseFloat(number).toFixed(decimalPlaces), this.width-5, canvasY);
	}

	this.drawNumbers = function() {
		if (this.min == null || this.max == null || this.step == null)
			return;
		var h = this.height;
		var cStep = h/((this.max-this.min)/this.step);
		var cOrigin = this.max*h/(this.max-this.min);
		var y;
		var start;
		if (cOrigin > 1 && cOrigin < h-1) {
			start = cOrigin;
		} else {
			//choose a reasonable start (which also affects axis labeling)
			start = 0
		}
		for (y = start + cStep; y < h; y += cStep) {
			this.drawNum(Math.round(y), -(y-cOrigin)/cStep*this.step);
		}
		for (y = start; y > 0; y -= cStep) {
			this.drawNum(Math.round(y), -(y-cOrigin)/cStep*this.step);
		}
	}

	this.drawLabel = function() {
		if (this.label == '' || this.label == null)
			return;
		var fontSize = 14;
		var ctx = this.canvas.getContext('2d');
		ctx.save();
		ctx.rotate(Math.PI/2);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.font = String(fontSize) + "px serif";
		ctx.fillText(this.label, this.height/2, 0);
		ctx.restore();
	}

	this.draw = function() {
		this.clearCanvas();
		this.drawNumbers();
		this.drawLabel();
	}
}

function AxisLineCanvas(sketchInterface, refDiv, width, height) {
	this.refDiv = refDiv;
	this.canvas = null;
	this.height = height;
	this.width = width;
	this.xmin = null; this.xmax = null; this.xstep = null;
	this.ymin = null; this.ymax = null; this.ystep = null;
        this.otherFeatures = [];
        /*Example Features:
	Dashed Line: {'type':'dashedLine', 'startxy':[x,y], 'endxy':[x,y]}


	*/

	BasicCanvas.call(this, sketchInterface, refDiv);
	this.color = [0,0,30,100];

	this.setXAxis = function(xmin, xmax, xstep) {
		this.xmin = xmin; this.xmax = xmax; this.xstep = xstep;
		this.draw();
	}

	this.setYAxis = function(ymin, ymax, ystep) {
		this.ymin = ymin; this.ymax = ymax; this.ystep = ystep;
		this.draw();
	}

	this.setFeatures = function(features) {
		this.otherFeatures = features;
		this.draw();
	}

	this.getSaveData = function() {
		return {'yaxis':{
				'min':this.ymin,
				'max':this.ymax,
				'step':this.ystep,
				'pixels':this.height
			}, 'xaxis':{
				'min':this.xmin,
				'max':this.xmax,
				'step':this.xstep,
				'pixels':this.width
			}
		};
	}

	this.drawDashedLine = function(feat) {
		var x1 = feat.startxy[0];
		var y1 = feat.startxy[1];
		var x2 = feat.endxy[0];
		var y2 = feat.endxy[1];
		// find corresponding indices
		var i1 = this.sketchInterface.xAxis.indexFromX(x1);
		var j1 = this.sketchInterface.yAxis.indexFromY(y1);
		var i2 = this.sketchInterface.xAxis.indexFromX(x2);
		var j2 = this.sketchInterface.yAxis.indexFromY(y2);
		// draw dashed line
		var ctx = this.canvas.getContext('2d');
		ctx.setLineDash([10,7]);
		ctx.beginPath();
		ctx.moveTo(i1,j1);
		ctx.lineTo(i2,j2);
		ctx.stroke();
	}

	this.drawYLines = function() {
		if (this.ymax == null || this.ymin == null || this.ystep == null)
			return;
		var h = this.height;
		var cStep = h/((this.ymax-this.ymin)/this.ystep);
		var cOrigin = this.ymax*h/(this.ymax-this.ymin);
		var y;
		var start;
		if (cOrigin > 1 && cOrigin < h-1) {
			start = cOrigin;
			for (y = cOrigin-1; y <= cOrigin+1; y++) {
				this.drawHorizontalLine(Math.round(y));
			}
		} else {
			//choose a reasonable start (which also affects axis labeling)
			start = 0
		}
		for (y = start; y < h; y += cStep) {
			this.drawHorizontalLine(Math.round(y));
		}
		for (y = start; y > 0; y -= cStep) {
			this.drawHorizontalLine(Math.round(y));
		}
	}

	this.drawXLines = function() {
		if (this.xmax == null || this.xmin == null || this.xstep == null)
			return;
		var w = this.width;
		var cStep = w/((this.xmax-this.xmin)/this.xstep);
		var cOrigin = -this.xmin*w/(this.xmax-this.xmin);
		var x;
		var start;
		if (cOrigin > 1 && cOrigin < w-1) {
			start = cOrigin;
			for (x = cOrigin-1; x <= cOrigin+1; x++) {
				this.drawVerticalLine(Math.round(x));
			}
		} else {
			//choose a reasonable start (which also affects axis labeling)
			start = 0
		}
		for (x = start; x < w; x += cStep) {
			this.drawVerticalLine(Math.round(x));
		}
		for (x = start; x > 0; x -= cStep) {
			this.drawVerticalLine(Math.round(x));
		}
	}

	this.drawFeatures = function() {
		var feat;
		for (var i = 0; i < this.otherFeatures.length; i++) {
			feat = this.otherFeatures[i];
			if (feat.type == 'dashedLine') {
				this.drawDashedLine(feat);
			} else {
				console.log('unrecognized feature', feat);
			}
		}
	}

	this.draw = function() {
		this.clearCanvas();
		this.drawFeatures();
		this.drawYLines();
		this.drawXLines();
	}

	this.draw();
}

function ImageCanvas(sketchInterface, refDiv, width, height) {	
	this.width = width;
	this.height = height;
	this.img = new Image();
	BasicCanvas.call(this, sketchInterface, refDiv);
	this.xScale = 1;
	this.yScale = 1;
	this.xOffset = 0;
	this.yOffset = 0;
	this.imageLoaded = false;

	var that = this;

	this.img.onload = function() {
		that.imageLoaded = true;
		that.draw();
	}

	this.setImageSource = function(imgsrc) {
		this.img.src = imgsrc;
	}

	this.setScale = function(xScale, yScale) {
		this.xScale = xScale;
		this.yScale = yScale;
		this.draw();
	}

	this.setOffset = function(xOffset, yOffset) {
		this.xOffset = xOffset;
		this.yOffset = yOffset;
		this.draw();
	}

	this.handleImage = function(e) {
		var reader = new FileReader();
		reader.onload = function(event) {
			that.imageLoaded = false;
			that.img.src = event.target.result;
		}
		reader.readDataURL(e.target.files[0]);
	}

	this.draw = function() {
		this.clearCanvas();
		if (this.imageLoaded) {
			var ctx = this.canvas.getContext('2d');
			var centerX = this.width/2 - this.img.width/2*this.xScale;
			var centerY = this.height/2 - this.img.height/2*this.yScale;
			ctx.drawImage(this.img, centerX + this.xOffset, centerY - this.yOffset, 
				this.img.width*this.xScale, this.img.height*this.yScale);
		}
	}
}

SKETCH_MODE = 0;
ERASE_MODE = 1;
function DrawingCanvas(sketchInterface, refDiv, width, height, drawingEnabled, recordingEnabled) {
	this.drawingEnabled = typeof drawingEnabled !== 'undefined' ? drawingEnabled : false;
	this.recordingEnabled = typeof recordingEnabled !== 'undefined' ? recordingEnabled : false;
	this.width = width;
	this.height = height;
	this.dataPixels = null;
	this.areListenersSetUp = false;
	this.mode = SKETCH_MODE;
	this.eraseRadius = 10;
	BasicCanvas.call(this, sketchInterface, refDiv);

	this.initialize = function() {
		this.blackPixels = {};
	}

	this.setupListeners = function() {
		if (this.areListenersSetUp || !this.drawingEnabled)
			return;
		this.areListenersSetUp = true;
		var lastX = 0;
		var lastY = 0;
		var isPressed = false;
		var that = this;

		this.canvas.onmousedown = function(e) {
			if (!that.drawingEnabled)
				return;

			lastX = e.layerX;
			lastY = e.layerY;
			isPressed = true;
			if (that.mode == SKETCH_MODE) {
				that.sketch(lastX, lastY);
				if (that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmousedown',
						'tool':'pencil',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				}
			} else if (that.mode == ERASE_MODE) {
				that.erase(lastX, lastY);
				if (that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmousedown',
						'tool':'eraser',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				}
			}
		}

		this.canvas.onmouseup = function(e) {
			if (!that.drawingEnabled || !isPressed)
				return;
			isPressed = false;
			if (that.mode == SKETCH_MODE) {
				that.sketch(e.layerX, e.layerY);
				if (that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmouseup',
						'tool':'pencil',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				}
			} else if (that.mode == ERASE_MODE) {
				that.erase(e.layerX, e.layerY);
				that.cleanupPixels();
				if (that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmouseup',
						'tool':'eraser',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				}
			}
		}

		this.canvas.onmouseleave = function(e) {
			if (that.drawingEnabled || isPressed) {
				if (that.mode == SKETCH_MODE && that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmouseleave',
						'tool':'pencil',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				} else if (that.mode == ERASE_MODE && that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmouseleave',
						'tool':'eraser',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
					that.cleanupPixels();
				}
				isPressed = false;
			}
			that.sketchInterface.hiddenData.update();
		}

		this.canvas.onmousemove = function(e) {
			if (!isPressed || !that.drawingEnabled)
				return;
			if (that.mode == SKETCH_MODE) {
				that.sketch(lastX, lastY, e.layerX, e.layerY)
				if (that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmousemove',
						'tool':'pencil',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				}
			} else if (that.mode == ERASE_MODE) {
					that.erase(lastX, lastY, e.layerX, e.layerY);
					if (that.recordingEnabled) {
					that.sketchInterface.recording.push({
						'layer':'drawing',
						'event':'onmousemove',
						'tool':'eraser',
						'x':e.layerX,
						'y':e.layerY,
						'time':new Date().getTime()
					});
				}
			}
			lastX = e.layerX;
			lastY = e.layerY;
		}
	}

	this.doRecordAction = function(record) {
		var e = {};
		e.layerX = record.x;
		e.layerY = record.y;
		if (record.tool == 'eraser') {
			this.mode = ERASE_MODE;
		} else {
			this.mode = SKETCH_MODE;
		}

		this.canvas[record.event](e);
	}

	this.sketch = function(x1, y1, x2, y2) {
		x2 = typeof x2 !== 'undefined' ? x2 : x1;
		y2 = typeof y2 !== 'undefined' ? y2 : y1;
		var inBetween = this.pointsBetween(x1, y1, x2, y2);
		for (var i = 0; i < inBetween.length; i++) {
			var x = inBetween[i][0], y = inBetween[i][1];
			this.blackPixels[[x,y]] = true; // actual graded data
			for (var dx = -1; dx <= 1; dx++) {
				for (var dy = -1; dy <= 1; dy++) {
					this.setPixel(x+dx, y+dy);
				}
			}
		}
	}

	this.erase = function(x1, y1, x2, y2) {
		x2 = typeof x2 !== 'undefined' ? x2 : x1;
		y2 = typeof y2 !== 'undefined' ? y2 : y1;
		
		var ctx = this.canvas.getContext('2d');
		ctx.save();
		ctx.globalCompositeOperation = "destination-out";
		ctx.strokeStyle = "rgba(0,0,0,1)";
		ctx.lineWidth = 0;
		ctx.fillStyle="rgba(0,0,0,1)";
		// part one
		ctx.beginPath();
		ctx.moveTo(x1, y1 + this.eraseRadius);
		ctx.lineTo(x2, y2 + this.eraseRadius);
		ctx.lineTo(x2, y2 - this.eraseRadius);
		ctx.lineTo(x1, y1 - this.eraseRadius);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		// part two
		ctx.moveTo(x1 + this.eraseRadius, y1);
		ctx.lineTo(x2 + this.eraseRadius, y2);
		ctx.lineTo(x2 - this.eraseRadius, y2);
		ctx.lineTo(x1 - this.eraseRadius, y1);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		// part three
		ctx.arc(x1,y1,this.eraseRadius, 0, 2*Math.PI, false);
		ctx.fill();
		ctx.arc(x2,y2,this.eraseRadius, 0, 2*Math.PI, false);
		ctx.fill();
		ctx.restore();
	}

	// make any pixels which are grey either black or white, not in between
	// also update dataPixels
	this.cleanupPixels = function() {
		var ctx = this.canvas.getContext('2d');
		var imgData = ctx.getImageData(0,0,this.canvas.width,this.canvas.height);

		var i, j, imgIndex, attrname;
		var keys = Object.keys(this.blackPixels);
		for (var count = 0; count < keys.length; count++) {
			attrname = keys[count];
			if (!(attrname in this.blackPixels)) continue;
			attrname = JSON.parse('['+attrname+']');
			i = attrname[0];
			j = attrname[1];
			imgIndex = (i + j*imgData.width)*4;
			if (imgData.data[imgIndex+3] < 128) {
				delete this.blackPixels[[i,j]];
			}
		}
		this.draw();
/*		for (var j = 0; j < this.height; j++) {
			for (var i = 0; i < this.width) {
				var index = (i + j*this.width)*4;
				if (this.dataPixels[j][i] and imgData.data[index] < 128) {
					this.dataPixels[j][i] = false;
				}
			}
		}
		for (var i = 0; i < imgData.data.length; i += 4) {
			if (imgData.data[i+3] != 0) {
				if (imgData.data[i] < 128) {
					imgData.data[i] = this.color[0];
					imgData.data[i+1] = this.color[1];
					imgData.data[i+2] = this.color[2];
					imgData.data[i+3] = this.color[3];
				} else {
					imgData.data[i] = 0;
					imgData.data[i+1] = 0;
					imgData.data[i+2] = 0;
					imgData.data[i+3] = 0;
				}
			}
		}
		ctx.putImageData(imgData,0,0);(*/
	}

	this.clearDrawing = function() {
		this.blackPixels = {};
		this.clearCanvas();
	}

	this.changeAxis = function(prevXMin, prevXMax, prevYMin, prevYMax, newXMin, newXMax, newYMin, newYMax) {
		var ctx = this.canvas.getContext('2d');
		/*var blacks = {}
		var imgData = ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
		for (var i = 0; i < this.canvas.width; i++) {
			for (var j = 0; j < this.canvas.height; j++) {
				var startIndex = j*4*this.canvas.width + i*4;
				if (imgData.data[startIndex+3] != 0 && imgData.data[startIndex] < 128) {
					blacks[[i,j]] = false; // false means nothing
				}
			}
		}*/

		var pos = Object.keys(this.blackPixels);
		var i, j;
		this.blackPixels = {};
		for (var ind = 0; ind < pos.length; ind++) {
			var k = JSON.parse('['+pos[ind]+']');
			i = k[0];
			j = k[1];
			x = Number((i/this.canvas.width)*(prevXMax-prevXMin) + prevXMin);
			y = prevYMax - (j/this.canvas.height)*(prevYMax - prevYMin);
			newI = Number(Math.round((x - newXMin)/(newXMax-newXMin)*this.canvas.width));
			newJ = Math.round((newYMax - y)/(newYMax-newYMin)*this.canvas.height);
			this.blackPixels[[newI,newJ]] = true;
		}
		this.draw();
	}

	this.getSaveData = function() {
		var list = [];
		var attrname, i, j;
		var keys = Object.keys(this.blackPixels);
		for (var count = 0; count < keys.length; count++) {
			attrname = keys[count];
			if (!(attrname in this.blackPixels)) continue;
			attrname = JSON.parse('['+attrname+']');
			i = attrname[0]; j = attrname[1];
			list.push({'i':i, 'j':j});
		}
		return {'blackPixels':list};
		/*var ctx = this.canvas.getContext('2d');
		var imgData = ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
		for (var i = 0; i < this.canvas.width; i++) {
			for (var j = 0; j < this.canvas.height; j++) {
				var startIndex = j*4*this.canvas.width + i*4;
				if (imgData.data[startIndex+3] != 0 && imgData.data[startIndex] < 128) {
					list.push({'i':i, 'j':j});
				}
			}
		}
		return {'blackPixels':list};*/
	}

	this.loadData = function(data) {
		var pixels = data.blackPixels;
		this.blackPixels = {};
		for (var x = 0; x < pixels.length; x++) {
			var i = pixels[x].i;
			var j = pixels[x].j;
			this.blackPixels[[i,j]] = true;
		}
		this.draw();
	}

	this.enable = function() {
		this.drawingEnabled = true;
		if (!this.areListenersSetUp)
			setupListeners();
	}

	this.disable = function() {
		this.drawingEnabled = false;
	}

	this.pointsBetween = function(x1,y1,x2,y2) {
		var ans = [];
		var total, slope;
		if (x1 == x2 && y1 == y2) {
			ans.push([x1,y1]);
		} else if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
			if (x1 > x2) {
				var x = x1, y = y1;
				x1 = x2; y1 = y2;
				x2 = x; y2 = y
			}
			total = x2 - x1;
			slope = (y2 - y1)/(x2 - x1);
			for (var x = x1; x <= x2; x++) {
				ans.push([x, Math.round(y1 + slope*(x - x1))]);
			}
		} else {
			if (y1 > y2) {
				var x = x1, y = y1;
				x1 = x2; y1 = y2;
				x2 = x; y2 = y
			}
			total = y2 - y1;
			slope = (x2 - x1)/(y2 - y1);
			for (var y = y1; y <= y2; y++) {
				ans.push([x1 + Math.round(slope*(y - y1)), y]);
			}
		}
		return ans;
	}

	this.draw = function() {
		this.clearCanvas();
		var i, j;
		for (var attrname in this.blackPixels) {
			if (!(attrname in this.blackPixels)) continue;
			attrname = JSON.parse('['+attrname+']');
			i = attrname[0];
			j = attrname[1];
			this.sketch(i,j);
		} 
	}

	this.initialize();
	this.setupListeners();
}

function CriticalPoint(criticalPointCanvas, label) {
	this.critCanvas = criticalPointCanvas;
	this.label = label;
	this.x = 50;
	this.y = 50;
	this.bigImg = null;
	this.bigOffsetx = 83;
	this.bigOffsety = 75;
	this.smallImg = null;
	this.smallOffsetx = 10;
	this.smallOffsety = 10;

	this.initialize = function() {
		this.bigImg = new Image();
		this.bigImg.src = 'speech-bubble.png';
		this.smallImg = new Image();
		this.smallImg.src = 'redx.png';
	}

	this.draw = function(bigBool) {
		var ctx = this.critCanvas.canvas.getContext('2d');
		if (bigBool && this.bigImg.complete) {
			ctx.drawImage(this.bigImg,this.x-this.bigOffsetx,this.y-this.bigOffsety);
			ctx.fillText(this.label, this.x - 70, this.y - 40);
		} else if (!bigBool && this.smallImg.complete) {
			ctx.drawImage(this.smallImg,this.x-this.smallOffsetx,this.y-this.smallOffsety);
		}
	}

	this.checkCollision = function(x, y, bigBool) {
		var image, offsetx, offsety;
		if (bigBool) {
			image = this.bigImg;
			offsetx = this.bigOffsetx;
			offsety = this.bigOffsety;
		} else {
			image = this.smallImg;
			offsetx = this.smallOffsetx;
			offsety = this.smallOffsety;
		}
		var difx = x - this.x + offsetx;
		var dify = y - this.y + offsety;
		return difx >= 0 && difx < image.width && dify >= 0 && dify < image.height;
	}

	this.initialize();
}

function CriticalPointSidebar(critCanvas, refDiv, width, height) {
	this.width = width;
	this.height = height;
	this.refDiv = refDiv;
	this.critCanvas = critCanvas;
	this.sideDiv = null;
	this.criticalPoints = {};

	this.enable = function() {
		
	}

	this.disable = function() {
		
	}

	this.initialize = function() {
		this.sideDiv = document.createElement('div');
		this.sideDiv.style.position = 'absolute';
		this.sideDiv.style.height = String(this.height) + 'px';
		this.sideDiv.style.width = '100px';
		this.sideDiv.style.left = String(this.width) + 'px';
		this.sideDiv.style.backgroundColor = 'FFF5EE';
		this.refDiv.appendChild(this.sideDiv);
	}

	this.addCriticalPoint = function(label, isMandatory, uses) {
		// search current critical points to make sure we're not making an extra one
		for (var lab in this.criticalPoints) {
			if (!this.criticalPoints.hasOwnProperty(lab)) {
				continue; // in case property came from a prototype
			}
			if (lab == label) {
				console.log('repeat critical point label', label);
				return;
			}
		}
		this.criticalPoints[label] = {'label':label, 'isMandatory':isMandatory, 'maxUses':uses, 'currentUses':0};
		var newThing = document.createElement('span');
		newThing.dataset['label'] = label;
		this.sideDiv.appendChild(newThing);
		this.updateSpan(label);
		var brk = document.createElement('br');
		this.sideDiv.appendChild(brk);
		// add listeners
		newThing.draggable = true;
		newThing.ondragstart = startDrag;
	}

	this.criticalPointUsed = function(label) {
		console.log(this.criticalPoints);
		this.criticalPoints[label]['currentUses'] += 1;
		if (this.criticalPoints[label]['currentUses'] == this.criticalPoints[label]['maxUses']) {
			var span = this.findSpan(label);
			span.draggable = false;
			span.style.color = 'magenta';
			//TODO: disable span dragging
		}
		this.updateSpan(label);
	}

	this.criticalPointUnused = function(label) {
		this.criticalPoints[label]['currentUses'] -= 1;
		if (this.criticalPoints[label]['currentUses'] == this.criticalPoints[label]['maxUses']-1) {
			var span = this.findSpan(label);
			span.draggable = true;
			span.style.color = 'black';
			//TODO: enable span dragging
		}
		
		this.updateSpan(label);
	}

	this.findSpan = function(label) {
		var spans = this.sideDiv.children;
		for (var i = 0; i < spans.length; i++) {
			if (spans[i].dataset['label'] == label)
				return spans[i];
		}
		return null;
	}

	this.updateSpan = function(label) {
		var span = this.findSpan(label);
		var uses = this.criticalPoints[label]['currentUses'];
		var maxUses = this.criticalPoints[label]['maxUses'];
		span.innerHTML = label + ' (' + uses + '/' + maxUses + ')';
	}

	this.reset = function() {
		for (var prop in this.criticalPoints) {
			if (this.criticalPoints.hasOwnProperty(prop)) {
				this.criticalPoints[prop]['currentUses'] = 0;
				this.updateSpan(prop);
			}
		}
	}

	var that = this;
	var startDrag = function(e) {
		e.dataTransfer.setData("label", this.dataset['label']);
	}

	this.resize = function(width, height) {
		this.height = height;
		this.width = width;
		this.sideDiv.style.height = String(this.height) + 'px';
	}

	this.reposition = function(x, y) {
		this.sideDiv.style.left = String(x+this.width) + 'px';
		this.sideDiv.style.top = String(y) + 'px';
	}

	this.initialize();
}

function CriticalPointCanvas(sketchInterface, refDiv, width, height) {
	this.width = width;
	this.height = height;
	this.selected = null;
	this.sidebar = null;
	this.areLabelsBig = true;
	this.isEnabled = true;
	this.eventReceiver = null;
	this.criticalPoints = [];
	this.recordingEnabled = true;
	BasicCanvas.call(this, sketchInterface, refDiv);

	this.initialize = function() {
		this.sidebar = new CriticalPointSidebar(this, this.refDiv, this.width, this.height);
	}

	this.resize = function(width, height) {
		this.width = width;
		this.height = height;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.sidebar.resize(width, height);
		this.draw();
	}

	this.reposition = function(x, y) {
		this.canvas.style.left = String(x) + "px";
		this.canvas.style.top = String(y) + "px";
		this.sidebar.reposition(x,y);
	}

	this.addPoints = function(list) {
		for (var i = 0; i < list.length; i++) {
			var label = list[i]['label'];
			var mandatory = list[i]['mandatory'];
			var maxUses = list[i]['max uses'];
			this.addCriticalPoint(label, mandatory, maxUses);
		}
	}

	this.addCriticalPoint = function(label, isMandatory, uses) {
		this.sidebar.addCriticalPoint(label, isMandatory, uses);
	}

	this.reset = function() {
		this.sidebar.reset();
		this.criticalPoints = [];
		this.draw();
	}

	this.enable = function() {
		this.isEnabled = true;
		this.sidebar.enable();
	}

	this.disable = function() {
		this.isEnabled = false;
		this.sidebar.disable();
	}

	this.setBigLabels = function() {
		this.areLabelsBig = true;
		this.draw();
	}

	this.setSmallLabels = function() {
		this.areLabelsBig = false;
		this.draw();
	}

	this.getSaveData = function() {
		var save = {}
		var cp;
		ans = [];
		for (var i = 0; i < this.criticalPoints.length; i++) {
			cp = this.criticalPoints[i];
			ans.push({'label':cp.label, 'i':cp.x, 'j':cp.y});
		}
		return {'usedPointList':ans};
	}

	this.loadData = function(saveData) {
                data = saveData['usedPointList'];
		for (var i = 0; i < data.length; i++) {
			var label = data[i].label;
			var x = data[i].i;
			var y = data[i].j;
			this.sidebar.criticalPointUsed(label);
			var newPoint = new CriticalPoint(this, label);
			newPoint.x = x;
			newPoint.y = y;
			this.criticalPoints.push(newPoint);
		}
		this.draw();
	}

	this.setupListeners = function() {
		var that = this;

		this.canvas.onmousedown = function(e) {
			// if disabled, pass event to drawing canvas
			if (!that.isEnabled) {
				that.eventReceiver.onmousedown(e);
				return;
			}
			// find first collision
			var cp;
			for (var i = 0; i < that.criticalPoints.length; i++) {
				cp = that.criticalPoints[i];
				if (cp.checkCollision(e.layerX, e.layerY, that.areLabelsBig)) {
					that.selected = cp;
					that.selected.x = e.layerX;
					that.selected.y = e.layerY;
					that.draw();
					break;
				}
			}
			if (that.selected != null && that.recordingEnabled) {
				that.sketchInterface.recording.push({
					'layer':'criticalPoint',
					'event':'pointSelected',
					'label':that.selected.label,
					'x':e.layerX,
					'y':e.layerY,
					'time':new Date().getTime()
				});
			}
			// if nothing was selected, pass event to drawing canvas below
			if (that.selected == null && that.eventReceiver != null) {
				that.eventReceiver.onmousedown(e);
				return;
			}
		}

		this.canvas.onmouseup = function(e) {
			if (that.selected == null && that.eventReceiver != null) {
				that.eventReceiver.onmouseup(e);
				return;
			}
			if (that.selected != null && that.recordingEnabled) {
				that.sketchInterface.recording.push({
					'layer':'criticalPoint',
					'event':'pointLetGo',
					'label':that.selected.label,
					'x':e.layerX,
					'y':e.layerY,
					'time':new Date().getTime()
				});
			}
			that.selected.x = e.layerX;
			that.selected.y = e.layerY;
			that.selected = null;
		}

		this.canvas.onmouseleave = function(e) {
			if (that.selected == null && that.eventReceiver != null) {
				that.eventReceiver.onmouseleave(e);
				return;
			}
			for (var i = 0; i < that.criticalPoints.length; i++) {
				cp = that.criticalPoints[i];
				if (cp === that.selected) {
					that.sidebar.criticalPointUnused(cp.label);
					that.criticalPoints.splice(i, 1);
					that.draw();
					if (that.recordingEnabled) {
						that.sketchInterface.recording.push({
							'layer':'criticalPoint',
							'event':'pointRemoved',
							'label':that.selected.label,
							'time':new Date().getTime()
						});
					}
					break;
				}
			}
			that.selected = null;
		}

		this.canvas.onmousemove = function(e) {
			if (that.selected == null && that.eventReceiver != null) {
				that.eventReceiver.onmousemove(e);
				return;
			}

			that.selected.x = e.layerX;
			that.selected.y = e.layerY;
			that.draw();
		}

		this.canvas.ondragover = function(e) {
			e.preventDefault();
		}

		this.canvas.ondrop = function(e) {
			var label = e.dataTransfer.getData('label')
			that.sidebar.criticalPointUsed(label);
			var newPoint = new CriticalPoint(that, label);
			newPoint.x = e.layerX;
			newPoint.y = e.layerY;
			that.criticalPoints.push(newPoint);
			if (that.recordingEnabled) {
				that.sketchInterface.recording.push({
					'layer':'criticalPoint',
					'event':'pointAdded',
					'label':label,
					'x':e.layerX,
					'y':e.layerY,
					'time':new Date().getTime()
				});
			}

			that.draw();
		}
	}

	this.draw = function() {
		this.clearCanvas();
		var cp;
		for (var i = 0; i < this.criticalPoints.length; i++) {
			cp = this.criticalPoints[i];
			cp.draw(this.areLabelsBig);
		}
	}

	this.setMouseEventReceiver = function(receiver) {
		this.eventReceiver = receiver;
	}

	this.initialize();
	this.setupListeners();
}
