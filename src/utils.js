'use strict';
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

/**************
* Modal utils *
**************/

/**
 * Format date object to Pickadate.js valid date.
 * @param {Object} date object to parse
 * @return {Array} array with [year, month, day] values
 */
function parseDate(date) {
	var momentDate = moment(date);
	return [momentDate.year(), momentDate.month(), momentDate.date()];
}

/**
 * Format date object to Pickadate.js valid time.
 * @param {Object} date object to parse
 * @return {Array} array with [hour, minutes] values
 */
function parseTime(date) {
	var momentDate = moment(date);
	return [momentDate.hour(), momentDate.minutes()];
}

/**
 * Use Pickadate.js to recover formatted date.
 * @param {Object} input field get as a selector
 */
function getDateValue(selector) {
	return selector.pickadate('picker').get('select', 'yyyy-mm-dd');
}

/**
 * Use Pickadate.js to recover formatted time.
 * @param {Object} input field get as a selector
 */
function getTimeValue(selector) {
	return selector.pickatime('picker').get('select', 'HH:i');
}

/**
 * Use Pickadate.js to set formatted date.
 * @param {Object} input field get as a selector
 * @param {Object} datetime object to set
 */
function setDateValue(selector, value) {
	return selector.pickadate('picker').set('select', parseDate(value));
}

/**
 * Use Pickadate.js to set formatted time.
 * @param {Object} input field get as a selector
 * @param {Object} datetime object to set
 */
function setTimeValue(selector, value) {
	return selector.pickatime('picker').set('select', parseTime(value));
}

/**
 * Use Moment.js to parse date and time into ISO-8601 format.
 * @param {Object} date with a format YYYY-MM-DD (2000-12-31)
 * @param {Object} time with a format HH:MM (23:59)
 */
function datetimeISOFormat(date, time) {
	return moment(date + ' ' + time, 'YYYY-MM-DD hh:mm').format();
}