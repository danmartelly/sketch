function GeneratedSketch(refDiv, options) {
	SketchInterface.call(this, refDiv, options);	
	this.sketches = [];
	this.curIndex = 0;
	this.initialize = function() {
		this.nextPrevToolbar = new NextPrevToolbar(this, this.toolbarDiv);
	}

	this.generateAnswer = function(criteriaOptions, visualOptions, type) {
		var that = this;
		// do a post with the criteria and visual options
		// get json data
		if (typeof criteriaOptions != "string")
			criteriaOptions = JSON.stringify(criteriaOptions);
		if (typeof visualOptions != "string")
			visualOptions = JSON.stringify(visualOptions);
		console.log('request type', type)
		var request = {'request':type,
			'criteriaOptions':criteriaOptions, 
			'visualOptions':visualOptions};
		$.post('receiveData.py', request).done(
			function(data, status){
				console.log('got data', data);
				data = JSON.parse(data);
				that.showGeneratedSketch(data[0]);
				that.sketches = data;
				that.curIndex = 0;
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data',data);
			});
	}

	this.showGeneratedSketch = function(dataScoreFeedback) {
		console.log('show', dataScoreFeedback);
		this.processStudentData(dataScoreFeedback['data']);
		this.submitToolbar.setFeedback(dataScoreFeedback['score'], dataScoreFeedback['feedback']);
	}
	this.initialize();
}

function NextPrevToolbar(sketchInterface, refDiv) {
	this.sketchInterface = sketchInterface;
	BasicFormToolbar.call(this, sketchInterface, refDiv);
	this.nextButton = null;
	this.prevButton = null;
	this.numberDisplay = null;

	this.initialize = function() {
		this.prevButton = document.createElement('input');
		this.prevButton.type = 'button';
		this.prevButton.value = 'Prev';
		this.mainForm.appendChild(this.prevButton);	

		this.nextButton = document.createElement('input');
		this.nextButton.type = 'button';
		this.nextButton.value = 'Next';
		this.mainForm.appendChild(this.nextButton);

		this.numberDisplay = document.createElement('p');
		this.numberDisplay.innerHTML = '0/0';
		this.mainForm.appendChild(this.numberDisplay);
	}

	this.setupListeners = function() {
		var that = this;
		this.prevButton.onclick = function(e) {
			that.prev();
		}
		this.nextButton.onclick = function(e) {
			that.next();
		}
	}

	this.prev = function() {
		var sketches = this.sketchInterface.sketches;
		console.log(sketches);
		if(sketches.length == 0) return;
		this.sketchInterface.curIndex += 1;
		this.sketchInterface.curIndex %= sketches.length;
		this.sketchInterface.showGeneratedSketch(sketches[this.sketchInterface.curIndex]);
		this.numberDisplay.innerHTML = "" + (this.sketchInterface.curIndex+1) + "/" + sketches.length;
	}

	this.next = function() {
		var sketches = this.sketchInterface.sketches;
		if(sketches.length == 0) return;
		this.sketchInterface.curIndex -= 1 - sketches.length;
		this.sketchInterface.curIndex %= sketches.length;
		this.sketchInterface.showGeneratedSketch(sketches[this.sketchInterface.curIndex]);
		this.numberDisplay.innerHTML = "" + (this.sketchInterface.curIndex+1) + "/" + sketches.length;
	}
	this.initialize();
	this.setupListeners();
}
