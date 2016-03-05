function GradeInterface(refDiv, options) {
	SketchInterface.call(this, refDiv, options);

	var div = document.createElement('div');
	refDiv.parentNode.insertBefore(div, refDiv);
	this.displayOptions = new DisplayOptions(this, div);
	div = document.createElement('div');
	refDiv.parentNode.insertBefore(div, refDiv);
	this.gradingOptions = new GradingOptions(this, div);

	this.initialize = function() {
		this.gradeCanvas = new GradeCanvas(this, this.refDiv, this.width, this.height);
		
		this.overlayToolbar = new OverlayOptionsToolbar(this, this.toolbarDiv);
		this.saveToolbar = new SeeSaveToolbar(this, this.toolbarDiv);
		this.generateToolbar = new GenerateAnswersToolbar(this, this.toolbarDiv);

		var p = document.createElement('p');
		p.innerHTML = 'Generated Answer Sketch';
		refDiv.parentNode.appendChild(p);
		var div = document.createElement('div');
		refDiv.parentNode.appendChild(div);
		this.generatedSketch = new GeneratedSketch(div, options);

		this.processOptions();
	}

	var processOptions = this.processOptions;
	this.processOptions = function() {
		processOptions.call(this);
		this.overlayToolbar.addSelf();
		this.generateToolbar.addSelf();
		//resizing
		this.gradeCanvas.reposition(80,0);
		this.gradeCanvas.resize(this.width, this.height);
		this.gradeCanvas.draw();
		
		this.generatedSketch.processOptions();
	}

	this.initialize();
}

function SeeSaveToolbar(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.getOptionsButton = null;
	this.setOptionsButton = null;
	this.displayOptionsText = null;
	this.gradingOptionsText = null;

	this.initialize = function() {
		//get
		this.getOptionsButton = document.createElement('input');
		this.getOptionsButton.type = 'button';
		this.getOptionsButton.value = 'Get Option Codes';
		this.mainForm.appendChild(this.getOptionsButton);
		//set
		this.setOptionsButton = document.createElement('input');
		this.setOptionsButton.type = 'button';
		this.setOptionsButton.value = 'Set Option Codes';
		this.mainForm.appendChild(this.setOptionsButton);
		var br = document.createElement('br');
		this.mainForm.appendChild(br.cloneNode());

		var textnode = document.createTextNode('Display Options Code');
		this.mainForm.appendChild(textnode);
		this.displayOptionsText = document.createElement('textarea');
		this.mainForm.appendChild(this.displayOptionsText);
		this.mainForm.appendChild(br.cloneNode());

		textnode = document.createTextNode('Criteria Options Code');
		this.mainForm.appendChild(textnode);
		this.gradingOptionsText = document.createElement('textarea');
		this.mainForm.appendChild(this.gradingOptionsText);
	}

	this.setupListeners = function() {
		var that = this;
		this.getOptionsButton.onclick = function(e) {
			var displayCode = that.sketchInterface.displayOptions.getChoices();
			that.displayOptionsText.value = JSON.stringify(displayCode);
			var criteriaCode = that.sketchInterface.gradingOptions.getCriteria();
			that.gradingOptionsText.value = JSON.stringify(criteriaCode);
		}

		this.setOptionsButton.onclick = function(e) {
			var displayCode = that.displayOptionsText.value;
			var criteriaCode = that.gradingOptionsText.value;
			if (displayCode != "") {
				displayCode = JSON.parse(displayCode);
				that.sketchInterface.displayOptions.setChoices(displayCode);
			}
			if (criteriaCode != "") {
				criteriaCode = JSON.parse(criteriaCode);
				that.sketchInterface.gradingOptions.setCriteria(criteriaCode);
			}
		}
	}

	this.initialize();
	this.setupListeners();
}

function OverlayOptionsToolbar(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.allowedDrawCheckbox = null;
	this.relationshipCheckbox = null;
	this.pointsCheckbox = null;

	this.initialize = function() {
		this.allowedDrawCheckbox = document.createElement('input');
		this.allowedDrawCheckbox.type = 'checkbox';
		this.allowedDrawCheckbox.checked = false;
		this.mainForm.appendChild(this.allowedDrawCheckbox);
		var label = document.createElement('label');
		label.innerHTML = 'Where to draw overlay';
		this.mainForm.appendChild(label);

		this.relationshipCheckbox = document.createElement('input');
		this.relationshipCheckbox.type = 'checkbox';
		this.relationshipCheckbox.checked = true;
		this.mainForm.appendChild(this.relationshipCheckbox);
		var label = document.createElement('label');
		label.innerHTML = 'Show icons overlay';
		this.mainForm.appendChild(label);

		this.pointsCheckbox = document.createElement('input');
		this.pointsCheckbox.type = 'checkbox';
		this.pointsCheckbox.checked = true;
		this.mainForm.appendChild(this.pointsCheckbox);
		var label = document.createElement('label');
		label.innerHTML = 'Show points overlay';
		this.mainForm.appendChild(label);

	}

	this.setupListeners = function() {
		var that = this;
		this.allowedDrawCheckbox.onclick = function(e) {
			that.sketchInterface.gradeCanvas.draw();
		}

		this.relationshipCheckbox.onclick = function(e) {
			that.sketchInterface.gradeCanvas.draw();
		}

		this.pointsCheckbox.onclick = function(e) {
			that.sketchInterface.gradeCanvas.draw();
		}
	}

	this.showAllowedForbidden = function() {
		return this.allowedDrawCheckbox.checked;
	}

	this.showRelationships = function() {
		return this.relationshipCheckbox.checked;
	}

	this.showPoints = function() {
		return this.pointsCheckbox.checked;
	}

	this.initialize();
	this.setupListeners();
}

function GenerateAnswersToolbar(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.randomButton = null;
	this.greedyButton = null;
        this.changingButton = null;

	this.initialize = function() {
		this.randomButton = document.createElement('input');
		this.randomButton.type = 'button';
		this.randomButton.value = 'Generate Random';
		this.mainForm.appendChild(this.randomButton);

		this.greedyButton = document.createElement('input');
		this.greedyButton.type = 'button';
		this.greedyButton.value = 'Generate Greedy';
		this.mainForm.appendChild(this.greedyButton);

		this.changingButton = document.createElement('input');
		this.changingButton.type = 'button';
		this.changingButton.value = 'Generate Changing Goodness';
		this.mainForm.appendChild(this.changingButton);

	}

	this.setupListeners = function() {
		var that = this;
		this.randomButton.onclick = function(e) {
			var co = that.sketchInterface.gradingOptions.getCriteria();
			var vo = that.sketchInterface.displayOptions.getChoices();
			that.sketchInterface.generatedSketch.generateAnswer(co, vo, 'random');
		}
		this.greedyButton.onclick = function(e) {
			var co = that.sketchInterface.gradingOptions.getCriteria();
			var vo = that.sketchInterface.displayOptions.getChoices();
			that.sketchInterface.generatedSketch.generateAnswer(co, vo, 'greedy');
		}
		this.changingButton.onclick = function(e) {
			var co = that.sketchInterface.gradingOptions.getCriteria();
			var vo = that.sketchInterface.displayOptions.getChoices();
			that.sketchInterface.generatedSketch.generateAnswer(co, vo, 'changingGood');
		}
	}

	this.initialize();
	this.setupListeners();
}

function GradeCanvas(sketchInterface, refDiv, width, height) {
	this.width = width;
	this.height = height;
	BasicCanvas.call(this, sketchInterface, refDiv);
	this.bracketIcon = new Image(190, 48);
	this.bracketIcon.src = 'bracket.png';

	// draw intersection of required things in green
	this.drawRequiredOverlay = function() {
		var criteria = this.sketchInterface.gradingOptions.criteriaList;
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			var polys = crit.requiredPolygons();
			if (polys != null) {
				for (var ind2 = 0; ind2 < polys.length; ind2++) {
					this.drawPolygon(polys[ind2], 0,150,0,100);
				}
			} else {
				this.colorPoints(crit.requiredList(), 0, 150, 0, 100);
			}
		}
	}

	// draw union of things to avoid in red
	this.drawForbiddenOverlay = function() {
		var criteria = this.sketchInterface.gradingOptions.criteriaList;
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			var polys = crit.forbiddenPolygons();
			if (polys != null) {
				for (var ind2 = 0; ind2 < polys.length; ind2++) {
					this.drawPolygon(polys[ind2], 200,0,0,100);
				}
			} else {
				this.colorPoints(crit.forbiddenList(), 200, 0, 0, 100);
			}
		}
	}

	this.colorPoints = function(indexList, r, g, b, a) {
		var ctx = this.canvas.getContext('2d');
		var imgData = ctx.getImageData(0,0,this.width, this.height);
		var setPixData = function(i,j,r,g,b,a) {
			var imgIndex = (i + j*imgData.width)*4;
			imgData.data[imgIndex] = r;
			imgData.data[imgIndex+1] = g;
			imgData.data[imgIndex+2] = b;
			imgData.data[imgIndex+3] = a;
		};
		for (var i = 0; i < indexList.length; i++) {
			setPixData(indexList[i][0], indexList[i][1],r,g,b,a);
		}
	}

	this.drawPolygon = function(indexList, r, g, b, a) {
		if (indexList.length == 0) return;
		var ctx = this.canvas.getContext('2d');
		ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a/256 + ")";
		ctx.beginPath();
		ctx.moveTo(indexList[0][0], indexList[0][1]);
		for (var i = 1; i < indexList.length; i++) {
			ctx.lineTo(indexList[i][0], indexList[i][1]);
		}
		ctx.closePath();
		ctx.fill();
	}

	this.drawRelationshipOverlay = function() {
		var ctx = this.canvas.getContext('2d');
		var criteria = this.sketchInterface.gradingOptions.criteriaList;
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			if (!crit.isRelationshipPresent()) {
				continue;
			}
			var range = crit.relationshipRange();
			var xmin = range[0], xmax = range[1];
			var imin = this.sketchInterface.xAxis.indexFromX(xmin);
			var imax = this.sketchInterface.xAxis.indexFromX(xmax);
			var w = imax - imin;
			ctx.drawImage(this.bracketIcon,imin,50,w,20);
			ctx.drawImage(crit.relationshipIcon(),imin + w/2,20);
		}
	}

	this.drawCriticalPointOverlay = function() {
		var ctx = this.canvas.getContext('2d');
		var criteria = this.sketchInterface.gradingOptions.criteriaList;
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			var pts = crit.getCriticalPoints();
			for (var ind2 = 0; ind2 < pts.length; ind2++) {
				console.log('sup');
				var p = pts[ind2];
				var x = p.x;
				var y = p.y;
				var pixels = p.pixelCloseness;
				var i = this.sketchInterface.xAxis.indexFromX(x);
				var j = this.sketchInterface.yAxis.indexFromY(y);
				console.log('x',x,'y',y,'pc',pixels,'i',i,'j',j,'p',p);
				ctx.beginPath();
				ctx.arc(i,j, pixels, 0, 2*Math.PI);
				ctx.moveTo(i,j);
				ctx.lineTo(i+pixels*Math.cos(2),j+pixels*Math.sin(2));
				ctx.stroke();
			}
		}

	}

	this.draw = function() {
		this.clearCanvas();
		if (this.sketchInterface.overlayToolbar.showAllowedForbidden()) {
			this.drawRequiredOverlay();
			this.drawForbiddenOverlay();
		}
		if (this.sketchInterface.overlayToolbar.showRelationships()) {
			this.drawRelationshipOverlay();
		}
		if (this.sketchInterface.overlayToolbar.showPoints()) {
			this.drawCriticalPointOverlay();
		}
	}
}
