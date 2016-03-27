function gaussBlur1D(array, considerDist) {
	considerDist = typeof considerDist !== 'undefined' ? considerDist : false;
	var sigma = 5;
	var radius = 5;
	if (considerDist) {
		sigma = 20;
		radius = 10;
	}
	var G = function(dx) {
		return 1/Math.sqrt(2*Math.PI*sigma*sigma)*Math.exp(-dx*dx/(2*sigma*sigma))
	}
	var smoothed = [];
	for (var x=0; x < array.length; x++) {
		var normalize = 0;
		var total = 0;
		for (var dx=-radius; dx <= radius; dx++) {
			if (x+dx < 0 || x+dx >= array.length)
				continue;
			var coeff;
			if (considerDist) {
				coeff = G(dx)*10*G(array[x]-array[x+dx]);
			} else {
				coeff = G(dx);
			}
			total += coeff*array[x+dx];
			normalize += coeff;
		}
		smoothed.push(total/normalize);
	}
	return smoothed;
}

/**
Base Drawing Tool Class
*/
function DrawingTool(sketchInterface, drawCanvas) {
	this.name = 'drawing';
	this.sketchInterface = sketchInterface;
	this.drawCanvas = drawCanvas;
	this.lastX = 0;
	this.lastY = 0;
	this.currentX = 0;
	this.currentY = 0;
	this.isPressed = false;
}

DrawingTool.prototype.mouseDraw = function(e) {
	// do nothing
	if (this.drawCanvas.recordingEnabled && this.isPressed) {
		this.sketchInterface.recording.push({
			'layer':'drawing',
			'event':e.type,
			'tool':this.name,
			'x':e.layerX,
			'y':e.layerY,
			'time':new Date().getTime()
		});
	}
}

// onmouse* functions return true if event is part of some
// stroke
DrawingTool.prototype.onmousedown = function(e) {
	this.lastX = e.layerX;
	this.lastY = e.layerY;
	this.currentX = this.lastX;
	this.currentY = this.lastY;
	this.isPressed = true;
	this.mouseDraw(e);
	return true;
}

DrawingTool.prototype.onmouseup = function(e) {
	this.lastX = e.layerX;
	this.lastY = e.layerY;
	this.currentX = this.lastX;
	this.currentY = this.lastY;
	if (this.isPressed) {
		this.isPressed = false;
		this.mouseDraw(e);
		return true;
	}
	return false;
}

DrawingTool.prototype.onmouseleave = function(e) {
	this.lastX = e.layerX;
	this.lastY = e.layerY;
	this.currentX = this.lastX;
	this.currentY = this.lastY;
	if (this.isPressed) {
		this.mouseDraw(e);
		this.isPressed = false;
		this.sketchInterface.hiddenData.update();
		return true;
	}
	this.sketchInterface.hiddenData.update();
	return false;
}

DrawingTool.prototype.onmousemove = function(e) {
	this.lastX = this.currentX;
	this.lastY = this.currentY;
	this.currentX = e.layerX;
	this.currentY = e.layerY;
	if (this.isPressed)
		this.mouseDraw(e);
	return this.isPressed;
}

/**
Freeform Pencil Tool Class
*/
function PencilTool(sketchInterface, drawCanvas) {
	DrawingTool.call(this, sketchInterface, drawCanvas);
	this.name = 'pencil';
}

PencilTool.prototype = Object.create(DrawingTool.prototype);

PencilTool.prototype.mouseDraw = function(e) {
	DrawingTool.prototype.mouseDraw.call(this, e);
	this.drawCanvas.sketch(this.lastX, this.lastY, this.currentX, this.currentY);
}

/**
Eraser Tool
*/
function EraserTool(sketchInterface, drawCanvas) {
	DrawingTool.call(this, sketchInterface, drawCanvas);
	this.name = 'eraser';
}

EraserTool.prototype = Object.create(DrawingTool.prototype);

EraserTool.prototype.mouseDraw = function(e) {
	DrawingTool.prototype.mouseDraw.call(this, e);
	this.drawCanvas.erase(this.lastX, this.lastY, this.currentX, this.currentY);
}

EraserTool.prototype.onmouseup = function(e) {
	if (this.isPressed) {
		DrawingTool.prototype.onmouseup.call(this,e);
		this.drawCanvas.cleanupPixels();
	} else {
		DrawingTool.prototype.onmouseup.call(this,e);
	}
}

EraserTool.prototype.onmouseleave = function(e) {
	if (this.isPressed) {
		DrawingTool.prototype.onmouseleave.call(this,e);
		this.drawCanvas.cleanupPixels();
	} else {
		DrawingTool.prototype.onmouseleave.call(this,e);
	}
}

/**
Auto Smoothing Pencil Tool Class
*/
function SmoothPencilTool(sketchInterface, drawCanvas) {
	DrawingTool.call(this, sketchInterface, drawCanvas);
	this.name = 'smooth pencil';
	this.strokePoints = []; // contains points in format [x,y]
}

SmoothPencilTool.prototype = Object.create(DrawingTool.prototype);

SmoothPencilTool.prototype.onmousedown = function(e) {
	DrawingTool.prototype.onmousedown.call(this, e);
	this.strokePoints = [[this.currentX, this.currentY]];
	var ctx = this.drawCanvas.inputCanvas.getContext('2d');
	ctx.fillRect(this.currentX, this.currentY,1,1);
}

SmoothPencilTool.prototype.onmousemove = function(e) {
	DrawingTool.prototype.onmousemove.call(this, e);
	if (this.isPressed) {
		this.strokePoints.push([this.currentX, this.currentY]);
		var ctx = this.drawCanvas.inputCanvas.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(this.lastX, this.lastY);
		ctx.lineTo(this.currentX, this.currentY);
		ctx.stroke()
	}
}

SmoothPencilTool.prototype.smoothStroke = function() {
	var xArr = [];
	var yArr = [];
	for (var i=0; i < this.strokePoints.length; i++) {
		xArr.push(this.strokePoints[i][0]);
		yArr.push(this.strokePoints[i][1]);
	}

	xArr = gaussBlur1D(xArr, true);
	yArr = gaussBlur1D(yArr, true);
	var smoothed = [];
	for (var i=0; i < this.strokePoints.length; i++) {
		smoothed.push([Math.round(xArr[i]),Math.round(yArr[i])]);
	}
	return smoothed;
}

SmoothPencilTool.prototype.onmouseup = function(e) {
	if (this.isPressed) {
		DrawingTool.prototype.onmouseup.call(this, e);
		this.strokePoints.push([this.currentX, this.currentY]);
		this.drawCanvas.sketchStroke(this.smoothStroke());
		this.drawCanvas.clearInputCanvas();
	} else {
		DrawingTool.prototype.onmouseup.call(this, e);
	}
	
}

SmoothPencilTool.prototype.onmouseleave = function(e) {
	if (this.isPressed) {
		this.drawCanvas.clearInputCanvas();
	}
	DrawingTool.prototype.onmouseleave.call(this, e);
}
/**
Line Tool
*/

function LineTool(sketchInterface, drawCanvas) {
	DrawingTool.call(this, sketchInterface, drawCanvas);
	this.name = 'line';
}

LineTool.prototype = Object.create(DrawingTool.prototype);

LineTool.prototype.onmousedown = function(e) {
	DrawingTool.prototype.onmousedown.call(this, e);
	this.startX = e.layerX;
	this.startY = e.layerY;
}

LineTool.prototype.onmousemove = function(e) {
	if (this.isPressed) {
		var endX = e.layerX;
		var endY = e.layerY;
		this.drawCanvas.clearInputCanvas();
		var ctx = this.drawCanvas.inputCanvas.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(this.startX, this.startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}
	DrawingTool.prototype.onmousemove.call(this, e);
}

LineTool.prototype.onmouseleave = function(e) {
	if (this.isPressed) {
		this.drawCanvas.clearInputCanvas();
	}
	DrawingTool.prototype.onmouseleave.call(this,e);
}

LineTool.prototype.onmouseup = function(e) {
	if (this.isPressed) {
		var endX = e.layerX;
		var endY = e.layerY;
		this.drawCanvas.sketch(this.startX, this.startY, endX, endY);
		this.drawCanvas.clearInputCanvas();
	}
	DrawingTool.prototype.onmouseup.call(this,e);
}