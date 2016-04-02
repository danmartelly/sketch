function TeacherView(dataHandler, refDiv, options) {
	SketchInterface.call(this, refDiv, options);
	this.dataHandler = dataHandler;
	this.gradingOptions = null;

	this.initialize = function() {
		this.gradeCanvas = new GradeCanvas(this, this.refDiv, this.width, this.height);
		
		//remove other toolbars
		this.drawingToolbar.removeSelf();
		this.submitToolbar.removeSelf();
		this.submitToolbar.mainForm.removeChild(this.submitToolbar.feedbackDiv);

		this.dataHandler.addDisplayOptionsListener(this);
		this.dataHandler.addCriteriaOptionsListener(this);

		this.processOptions();
	}

	this.processDisplayOptions = function(options) {
		this.updateOptions(options);
	}

	this.processCriteriaOptions = function(options) {
		this.gradeCanvas.draw();
	}

	this.getCriteriaInstancesList = function() {
		if (this.gradingOptions == null)
			return [];
		return this.gradingOptions.criteriaList;
	}

	var processOptions = this.processOptions;
	this.processOptions = function() {
		processOptions.call(this);
		this.submitToolbar.removeSelf();
		//resizing
		this.gradeCanvas.reposition(80,0);
		this.gradeCanvas.resize(this.width, this.height);
		this.gradeCanvas.draw();
	}

	this.initialize();
}

function GradeCanvas(sketchInterface, refDiv, width, height) {
	this.width = width;
	this.height = height;
	BasicCanvas.call(this, sketchInterface, refDiv);
	this.bracketIcon = new Image(190, 48);
	this.bracketIcon.src = 'bracket.png';

	// draw intersection of required things in green
	this.drawRequiredOverlay = function(canv) {
		var criteria = this.sketchInterface.getCriteriaInstancesList();
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			if (!crit.shouldVisualize) continue;
			var polys = crit.requiredPolygons();
			if (polys != null) {
				for (var ind2 = 0; ind2 < polys.length; ind2++) {
					this.drawPolygon(canv, polys[ind2], 0,150,0,255);
				}
			} else {
				//this.colorPoints(canv, crit.requiredList(), 0, 150, 0, 255);
			}
		}
	}

	// draw union of things to avoid in red
	this.drawForbiddenOverlay = function(canv) {
		var criteria = this.sketchInterface.getCriteriaInstancesList();
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			if (!crit.shouldVisualize) continue;
			var polys = crit.forbiddenPolygons();
			if (polys != null) {
				for (var ind2 = 0; ind2 < polys.length; ind2++) {
					this.drawPolygon(canv, polys[ind2], 200,0,0,255);
				}
			} else {
				//this.colorPoints(canv, crit.forbiddenList(), 200, 0, 0, 255);
			}
		}
	}

	this.colorPoints = function(canv, indexList, r, g, b, a) {
		var ctx = canv.getContext('2d');
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

	this.drawPolygon = function(canv, indexList, r, g, b, a) {
		if (indexList.length == 0) return;
		var ctx = canv.getContext('2d');
		ctx.save();
	        ctx.globalCompositeOperation = "lighten";
		ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a/256 + ")";
		ctx.beginPath();
		ctx.moveTo(indexList[0][0], indexList[0][1]);
		for (var i = 1; i < indexList.length; i++) {
			ctx.lineTo(indexList[i][0], indexList[i][1]);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	this.drawGreenRedOverlay = function() {
		var canv = document.createElement('canvas');
		canv.width = this.width;
		canv.height = this.height;
		this.drawForbiddenOverlay(canv);
		this.drawRequiredOverlay(canv);
		var realctx = this.canvas.getContext('2d');
		realctx.save();
		realctx.globalAlpha = .4;
		realctx.drawImage(canv, 0, 0);
		realctx.restore();
	}

	this.drawRelationshipOverlay = function() {
		var ctx = this.canvas.getContext('2d');
		var criteria = this.sketchInterface.getCriteriaInstancesList();
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			if (!crit.shouldVisualize) continue;
			if (!crit.isRelationshipPresent()) {
				continue;
			}
			var range = crit.relationshipRange();
			var xmin = range[0], xmax = range[1];
			var imin = this.sketchInterface.xAxis.indexFromX(xmin);
			var imax = this.sketchInterface.xAxis.indexFromX(xmax);
			var w = imax - imin;
			ctx.drawImage(this.bracketIcon,imin,50,w,20);
			var callback = function(icon) {
				ctx.drawImage(icon, imin+w/2,20);
			};
			crit.relationshipIcon(callback);
			//ctx.drawImage(crit.relationshipIcon(),imin + w/2,20);
		}
	}

	this.drawCriticalPointOverlay = function() {
		var ctx = this.canvas.getContext('2d');
		var criteria = this.sketchInterface.getCriteriaInstancesList();
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			if (!crit.shouldVisualize) continue;
			var pts = crit.getCriticalPoints();
			for (var ind2 = 0; ind2 < pts.length; ind2++) {
				var p = pts[ind2];
				var x = p.x;
				var y = p.y;
				var pixels = p.pixelRadius;
				var i = this.sketchInterface.xAxis.indexFromX(x);
				var j = this.sketchInterface.yAxis.indexFromY(y);
				ctx.beginPath();
				ctx.arc(i,j, pixels, 0, 2*Math.PI);
				ctx.moveTo(i,j);
				ctx.lineTo(i+pixels*Math.cos(2),j+pixels*Math.sin(2));
				ctx.stroke();
			}
		}

	}

	this.drawSlopesOverlay = function() {
		var criteria = this.sketchInterface.getCriteriaInstancesList();
		for (var ind = 0; ind < criteria.length; ind++) {
			var crit = criteria[ind];
			if (!crit.shouldVisualize) continue;
			var slopes = crit.getSlopes();
			console.log('slopes',slopes);
			for (var ind2 = 0; ind2 < slopes.length; ind2++) {
				var p = slopes[ind2];
				var x = p.x;
				var y = p.y;
				var slope = p.slope;
				var ae = p.angleError;
				this.drawSlope(x, y, slope, ae)
			}

		}
	}

	this.drawSlope = function(x, y, slope, angleError) {
		var ctx = this.canvas.getContext('2d');
		//figure out values in terms of indices
		var i = this.sketchInterface.xAxis.indexFromX(x);
		var j = this.sketchInterface.yAxis.indexFromY(y);
		var xperi = this.sketchInterface.xAxis.xFromIndex(5) - this.sketchInterface.xAxis.xFromIndex(4);
		var yperj = this.sketchInterface.yAxis.yFromIndex(5) - this.sketchInterface.yAxis.yFromIndex(4);
		var ijSlope = slope*yperj/xperi;
		var angle = Math.atan(ijSlope);
		console.log('angle', angle);
		// draw 3 lines
		this.drawLineAtAngle(i, j, 20, angle + angleError, 0, 128, 255, 100);
		this.drawLineAtAngle(i, j, 20, angle - angleError, 0, 128, 255, 100);
		this.drawLineAtAngle(i, j, 20, angle, 0, 0, 0, 256);
	}

	this.drawLineAtAngle = function(i, j, length, angle, r, g, b, a) {
		var starti = i - length/2*Math.cos(angle);
		var startj = j - length/2*Math.sin(angle);
		var endi = i + length/2*Math.cos(angle);
		var endj = j + length/2*Math.sin(angle);
		var ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a/256 + ")";
		ctx.lineWidth = 2;
		ctx.moveTo(starti, startj);
		ctx.lineTo(endi, endj);
		ctx.stroke();
	}

	this.draw = function() {
		this.clearCanvas();
		this.drawGreenRedOverlay();
		this.drawCriticalPointOverlay();
		this.drawSlopesOverlay();
		this.drawRelationshipOverlay();
	}
}
