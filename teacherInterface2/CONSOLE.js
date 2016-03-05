CONSOLE = new function() {
	var lastTime = new Date().getTime();
	this.log = function() {
		var args = Array.prototype.slice.call(arguments);
		var curTime = new Date().getTime();
		args.splice(0, 0, "tslc " + (curTime-lastTime));
		lastTime = curTime;
		console.log.apply(console, args);
	}
}();
