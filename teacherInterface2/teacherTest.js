function TeacherTest(dataHandler, refDiv, options) {
	SketchInterface.call(this, refDiv, options);
	this.dataHandler = dataHandler;

	this.initialize = function() {
		this.dataHandler.addDisplayOptionsListener(this);

		var that = this;
		var subTool = this.submitToolbar;
		this.submitToolbar.submitButton.onclick = function(e) {
			console.log('updating');
			var axisSave = that.axisLineCanvas.getSaveData();
			var drawingSave = that.drawingCanvas.getSaveData();
			var criticalSave = that.criticalPointCanvas.getSaveData();
			var recording = that.recording;
			var data = {'axes':axisSave, 'drawing':drawingSave, 
				'criticalPoints':criticalSave, 'recording':recording};
			var criteria = that.dataHandler.getCriteriaOptions();
			var dataToSend = {
				request: 'teacherTest',
				criteria: JSON.stringify(criteria),
				data: JSON.stringify(data)
			};
			subTool.loadingImage.style.display = 'inline';
			$.post('serverInterface.py', data).done(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
				data = JSON.parse(data);
				subTool.setFeedback(data['grade'], data['feedback']);
				subTool.loadingImage.style.display = 'none';
			}).fail(
			function(data, status){
				console.log('status', status);
				console.log('data', data);
			});
		};
	}

	this.processDisplayOptions = function(options) {
		this.updateOptions(options);
	}

	this.initialize();
}