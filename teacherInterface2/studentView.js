function StudentView(dataHandler, refDiv, options) {
	SketchInterface.call(this, refDiv, options);
	this.dataHandler = dataHandler;

	this.initialize = function() {
		this.dataHandler.addDisplayOptionsListener(this);
	}

	this.processDisplayOptions = function(options) {
		this.updateOptions(options);
	}

	this.initialize();
}