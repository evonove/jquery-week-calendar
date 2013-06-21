function _filter(array, attrName, attrValue){
	//Array.filter method is mplemented in JavaScript 1.6, supported by most modern browsers
	//If for supporting the old browser, you could write your own one.
	try {
		var endArray = array.filter(function(el){
			return el[attrName] !== attrValue;
		});
		return endArray
	} catch(err) {
		var endArray = array
	 	$.each(array, function(index, obj){
			if (obj[attrName] === attrValue){
				endArray.splice(index, 1);
			}
		});
		return endArray;
	 } 
}

function refeshUsers(loadedUsers, removedUserIds) {
	var endArray = loadedUsers;
	$.each(removedUserIds, function(index, userId){
		endArray = _filter(endArray, 'id', userId);
	});
	return endArray;
};
