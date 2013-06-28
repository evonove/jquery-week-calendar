(function(TimelyUi) {
	'use strict';
	TimelyUi.utils = TimelyUi.utils || {};

	/*************************
	 * Javascript prototypes *
	 ************************/

	String.prototype.format = String.prototype.f = function() {
		var s = this,
			i = arguments.length;

		while (i--) {
			s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
		}
		return s;
	};

	/*****************
	 * Generic utils *
	 ****************/

	/* Array.filter method is implemented in JavaScript 1.6, supported by most modern browsers.
	   If for supporting the old browser, you could write your own one. */
	TimelyUi.utils._filter = function(array, attrName, attrValue) {
		try {
			var endArray = array.filter(function(el) {
				return el[attrName] !== attrValue;
			});
			return endArray;
		} catch(err) {
			var endArray = array;
			$.each(array, function(index, obj) {
				if (obj[attrName] === attrValue) {
					endArray.splice(index, 1);
				}
			});
			return endArray;
		}
	};

	TimelyUi.utils.refreshUsers = function(loadedUsers, removedUserIds) {
		var endArray = loadedUsers,
			filter = TimelyUi.utils._filter;

		$.each(removedUserIds, function(index, userId){
			endArray = filter(endArray, 'id', userId);
		});
		return endArray;
	};

	TimelyUi.utils.hideUserColumn = function(userId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils,
			$placeholder,
			colspan;

		options.removedUserIds.splice(options.removedUserIds.indexOf(userId),1);
		options.users = utils.refreshUsers(options.loadedUsers, options.removedUserIds);
		$placeholder = $('.wc-timeslot-placeholder');
		colspan = parseInt($placeholder.attr('colspan'), 10);
		colspan++;
		$placeholder.attr('colspan', colspan);
	};

	TimelyUi.utils.showUserColumn = function(userId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils,
			$placeholder,
			colspan;

		options.removedUserIds.push(userId);
		options.users = utils.refreshUsers(options.loadedUsers, options.removedUserIds);
		$placeholder = $('.wc-timeslot-placeholder');
		colspan = parseInt($placeholder.attr('colspan'), 10);
		colspan--;
		$placeholder.attr('colspan', colspan);
	};

	/*****************
	* Datetime utils *
	*****************/

	TimelyUi.utils.formatDate = function(date, format) {
		return moment(date).format(format);
	};

	/**
	 * Format date object to Pickadate.js valid time.
	 * @param {Object} date object to parse
	 * @return {Array} array with [hour, minutes] values
	 */
	TimelyUi.utils.timeToArray = function(date) {
		var momentDate = moment(date);
		return [momentDate.hour(), momentDate.minutes()];
	};

	/**
	 * Use Moment.js to parse date and time into ISO-8601 format.
	 * @param {Object} date with a format YYYY-MM-DD (2000-12-31)
	 * @param {Object} time with a format HH:MM (23:59)
	 */
	TimelyUi.utils.datetimeISOFormat = function(date, time) {
		return moment(date + ' ' + time, 'MM-DD-YYYY HH:mm').format();
	};
})(TimelyUi);