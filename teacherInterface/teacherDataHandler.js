function DataHandler() {
	this.displayOptions = {};
	this.criteriaOptions = [];
	this.displayChangeListeners = [];
	this.criteriaChangeListeners = [];
}

DataHandler.prototype.setDisplayOptions = function(newDisplayOptions) {
	this.displayOptions = newDisplayOptions;
	for (var i = 0; i < this.displayChangeListeners.length; i++) {
		this.displayChangeListeners[i].processDisplayOptions(this.displayOptions);
	}
}

DataHandler.prototype.getDisplayOptions = function() {
	return this.displayOptions;
}

DataHandler.prototype.addDisplayOptionsListener = function(obj) {
	this.displayChangeListeners.push(obj);
}

DataHandler.prototype.setCriteriaOptions = function(newCriteriaOptions, caller) {
	this.criteriaOptions = newCriteriaOptions;
	for (var i = 0; i < this.criteriaChangeListeners.length; i++) {
		if (caller == this.criteriaChangeListeners[i]) continue;
		this.criteriaChangeListeners[i].processCriteriaOptions(this.criteriaOptions);
	}
}

DataHandler.prototype.getCriteriaOptions = function() {
	return this.criteriaOptions;
}

DataHandler.prototype.addCriteriaOptionsListener = function(obj) {
	this.criteriaChangeListeners.push(obj);
}
