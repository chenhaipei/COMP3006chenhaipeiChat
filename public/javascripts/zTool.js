//Some object variables and methods are defined
//Encapsulating two objects,Simple Map and Circle List
//Any information about online users is available through the Simple Map method.
//The object Circle List is used to get historical chat history, and by default it is up to 10 chats to get the latest chat history.
(function(exports) {
	//get a list of online users
	let SimpleMap = exports.SimpleMap = function () {
		this.map = {};
		this.mapSize = 0;
	};

	//Add a user
	SimpleMap.prototype.put = function(key, value) {
		let oldValue = this.map[key];
		this.map[key] = value;
		if(!oldValue) {
			this.mapSize++;
		}
		return(oldValue || value);
	};

	//gets the specified id user
	SimpleMap.prototype.get = function(key) {
		return this.map[key];
	};

	//Remove the user with the specified id
	SimpleMap.prototype.remove = function(key) {
		let v = this.map[key];
		if(v) {
			delete this.map[key];
			this.mapSize--;
		}
		return v;
	};

	//Gets the size of the list of users, that is, the number of users currently online
	SimpleMap.prototype.size = function() {
		return this.mapSize;
	};

	//Empty the list of users
	SimpleMap.prototype.clear = function() {
		this.map = {};
		this.mapSize = 0;
	};

	//Get all the user id arrays
	SimpleMap.prototype.keySet = function() {
		let theKeySet = [];
		for(let i in this.map) {
			theKeySet.push(i);
		}
		return theKeySet;
	};

	//Gets an array of all user names
	SimpleMap.prototype.values = function() {
		let theValue = [];
		for(let i in this.map) {
			theValue.push(this.map[i]);
		}
		return theValue;
	};

	//Pass in a parameter maxSize
	// Update the maximum number of bars to get chat history
	let CircleList = exports.CircleList = function (maxSize) {
		this.maxSize = (maxSize || 10);
		this.list = [];
		this.index = null;
	};

	//Empty the chat history
	CircleList.prototype.clear = function() {
		this.list = [];
		this.index = null;
	};

	//Add a chat history
	CircleList.prototype.add = function(value) {
		if(null == this.index) {
			this.index = 0;
		}

		this.list[this.index++] = value;

		if(this.index === this.maxSize) {
			this.index = 0;
		}
	};

	//Get the latest maxSize chat history
	CircleList.prototype.values = function() {
		let theValue = [];
		if(null != this.index) {
			if(this.list.length === this.maxSize) {
				for(let i = this.index; i < this.maxSize; i++) {
					theValue.push(this.list[i]);
				}
			}

			for(let j = 0; j < this.index; j++) {
				theValue.push(this.list[j]);
			}
		}
		//Update and get chat history
		return theValue;
	};

})((function() {
	if(typeof exports === 'undefined') {
		window.zTool = {};
		return window.zTool;
	} else {
		return exports;
	}
})());
