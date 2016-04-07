function LoadSaveOptions(dataHandler, refDiv) {
	this.dataHandler = dataHandler;
	this.refDiv = refDiv;

	this.getOptionsButton = null;
	this.setOptionsButton = null;
	this.displayOptionsText = null;
	this.gradingOptionsText = null;
	this.participantText = null;
	this.problemText = null;
	this.submitButton = null;
	this.loadingGIF = null;
	this.failedText = null;

	this.initialize = function() {
		//get
		this.getOptionsButton = document.createElement('input');
		this.getOptionsButton.type = 'button';
		this.getOptionsButton.value = 'Get Option Codes';
		this.refDiv.appendChild(this.getOptionsButton);
		//set
		this.setOptionsButton = document.createElement('input');
		this.setOptionsButton.type = 'button';
		this.setOptionsButton.value = 'Set Option Codes';
		this.refDiv.appendChild(this.setOptionsButton);
		var br = document.createElement('br');
		this.refDiv.appendChild(br.cloneNode());

		var textnode = document.createTextNode('Display Options Code');
		this.refDiv.appendChild(textnode);
		this.displayOptionsText = document.createElement('textarea');
		this.refDiv.appendChild(this.displayOptionsText);
		this.refDiv.appendChild(br.cloneNode());

		textnode = document.createTextNode('Criteria Options Code');
		this.refDiv.appendChild(textnode);
		this.gradingOptionsText = document.createElement('textarea');
		this.refDiv.appendChild(this.gradingOptionsText);
		
		this.refDiv.appendChild(br.cloneNode());
		this.refDiv.appendChild(br.cloneNode());
		textnode = document.createTextNode("Your name: ");
		this.refDiv.appendChild(textnode);
		this.participantText = document.createElement('input');
		this.participantText.type = 'text';
		this.refDiv.appendChild(this.participantText);

		this.refDiv.appendChild(br.cloneNode());
		textnode = document.createTextNode("Problem name: ");
		this.refDiv.appendChild(textnode);
		this.problemText = document.createElement('input');
		this.problemText.type = 'text';
		this.refDiv.appendChild(this.problemText);

		this.refDiv.appendChild(br.cloneNode());
		this.submitButton = document.createElement('input');
		this.submitButton.type = 'button';
		this.submitButton.value = "Submit Option Choices";
		this.refDiv.appendChild(this.submitButton);
		this.loadingGIF = new Image();
		this.loadingGIF.src = "../loading.gif";
		this.loadingGIF.style.display = "none";
		this.refDiv.appendChild(this.loadingGIF);
		this.failedText = document.createElement("span");
		this.failedText.innerHTML = "Submission Failed";
		this.failedText.style["color"] = "red";
		this.failedText.style.display = "none";
		this.refDiv.appendChild(this.failedText);
	}

	this.setupListeners = function() {
		var that = this;
		this.getOptionsButton.onclick = function(e) {
			var displayCode = that.dataHandler.getDisplayOptions();
			that.displayOptionsText.value = JSON.stringify(displayCode);
			var criteriaCode = that.dataHandler.getCriteriaOptions();
			that.gradingOptionsText.value = JSON.stringify(criteriaCode);
		}

		this.setOptionsButton.onclick = function(e) {
			var displayCode = that.displayOptionsText.value;
			var criteriaCode = that.gradingOptionsText.value;
			if (displayCode != "") {
				displayCode = JSON.parse(displayCode);
				that.dataHandler.setDisplayOptions(displayCode);
			}
			if (criteriaCode != "") {
				criteriaCode = JSON.parse(criteriaCode);
				that.dataHandler.setCriteriaOptions(criteriaCode);
			}
		}

		this.submitButton.onclick = function(e) {
			that.loadingGIF.style.display = "inline";
			that.failedText.style.display = "none";

			if (that.problemText.value == "" || that.participantText.value == "") {
				that.loadingGIF.style.display = "none";
				that.failedText.style.display = "inline";
				that.failedText.innerHTML = "Name fields left blank";
				return;
			}

			var displayOptions = that.dataHandler.getDisplayOptions();
			displayOptions = JSON.stringify(displayOptions);
			var criteriaOptions = that.dataHandler.getCriteriaOptions();
			criteriaOptions = JSON.stringify(criteriaOptions);
			var dataToSend = {'request':"saveOptions",
				"personName":that.participantText.value,
				"problemName":that.problemText.value,
				"criteria":criteriaOptions,
				"display":displayOptions};
			$.post('serverInterface.py', dataToSend).done(
			function(data, status){
				console.log(data);
				that.loadingGIF.style.display = "none";
				that.failedText.style.display = "none";
			}).fail(
			function(data, status) {
				console.log(data);
				that.loadingGIF.style.display = "none";
				that.failedText.style.display = "inline";
				that.failedText.innerHTML = "Submission Failed";
			});
		}
	}

	this.initialize();
	this.setupListeners();
}
