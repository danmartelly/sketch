function LoadSaveOptions(dataHandler, refDiv) {
	this.dataHandler = dataHandler;
	this.refDiv = refDiv;

	this.getOptionsButton = null;
	this.setOptionsButton = null;
	this.displayOptionsText = null;
	this.gradingOptionsText = null;

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
	}

	this.initialize();
	this.setupListeners();
}