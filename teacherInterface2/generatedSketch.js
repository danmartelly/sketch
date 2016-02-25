function GeneratedSketch(refDiv, options) {
	
	this.refDiv = refDiv;
	this.options = options;
	this.initialize = function() {
		this.sketchInterface = new SketchInterface(this.refDiv, this.options);
	}

	this.processOptions = function() {
		this.sketchInterface.processOptions();
	}

	this.generateAnswer = function(criteriaOptions) {
		// do a post with the criteria and visual options
		// get json data
		$.post('receiveData.py', request).done(
			function(data, status){
				console.log('status', status);
				console.log('data',data);
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data',data);
			});
	}
	this.initialize();
}