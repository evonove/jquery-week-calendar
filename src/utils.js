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

	/**
	 * Refresh the value of attr colspan in two DOM elements to render calendar widget correctly when users are added o removed.
	 * @param {boolean} isAdd must be true when an user is added
	 */
	TimelyUi.utils._addRemoveColSpan = function(isAdd) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils,
			$placeholder,
			$header,
			colspan;

		options.users = utils.refreshUsers(options.loadedUsers, options.removedUserIds);
		$placeholder = $('.wc-timeslot-placeholder');
		$header = $('.wc-day-column-header');
		colspan = parseInt($placeholder.attr('colspan'), 10);
		if (isAdd) {
			colspan++;
		} else {
			colspan--;
		}
		$placeholder.attr('colspan', colspan);
		$header.attr('colspan', colspan);
	};

	/**
	 * Refresh the value of attr width in some DOM elements to render calendar widget correctly when users are added o removed.
	 * @param {Number} maxColumnNumber_ is the number of displayed user in same page by the widget. Default is 5.
	 */
	TimelyUi.utils.redimColumnsWidth = function(maxColumnNumber_) {
		var options = TimelyUi.calendar.options,
			width = $('#calendar-body-wrapper').width()-45,
			maxColumnNumber = (maxColumnNumber_) ? maxColumnNumber_ : TimelyUi.columnsToShow,
			divindend = (options.users.length > maxColumnNumber) ? maxColumnNumber : options.users.length,
			rightSingleWidth = width/divindend,
			rightWidth = rightSingleWidth*options.users.length+45;

		TimelyUi.dispelVodooMagic();
		$('.scroller, .wc-time-slots').width(rightWidth);
		$('table .ui-state-default, table .wc-user-header').not('.wc-grid-timeslot-header, .wc-time-column-header').each(function(index, el){
			$(this).width(rightSingleWidth);
		});
		$.each(TimelyUi.elIScrolls, function(key, val){
			val.refresh();
		});
		TimelyUi.vodooMagic();
	};

	/**
	 * Refresh the TimelyUi.conf.users dictonary subtracting removedUserIds from loadedUsers.
	 * @param {Object} is a dictionary of users. Default is TimelyUi.conf.loadedUsers
	 * @param {Object} is a array of user ids. Default is TimelyUi.conf.removedUserIds
	 */
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
			utils = TimelyUi.utils;
			
		options.removedUserIds.splice(options.removedUserIds.indexOf(userId),1);
		utils._addRemoveColSpan(true);
		utils.redimColumnsWidth();
	};

	TimelyUi.utils.showUserColumn = function(userId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils;

		options.removedUserIds.push(userId);
		utils._addRemoveColSpan(false);
		utils.redimColumnsWidth();
	};

	/*****************
	* Datetime utils *
	*****************/

	/**
	 * Moment.js wrapper
	 * @param {Object} date with any format
	 * @param {String} a valid Moment.js format string
	 * @return {String} a formatted datetime
	 */
	TimelyUi.utils.formatDate = function(date, format) {
		return moment(date).format(format);
	};

	/**
	 * Moment.js wrapper
	 * @param {Object} date with any format
	 * @return {Date} a POJO date
	 */
	TimelyUi.utils.toDate = function(date) {
		return moment(date).toDate();
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
	 * @return {String} a valid ISO-8601 format
	 */
	TimelyUi.utils.datetimeISOFormat = function(date, time) {
		return moment(date + ' ' + time, 'MM-DD-YYYY HH:mm').format();
	};

	/**
	 * Convert datetime to a valid UNIX timestamp
	 * @param {Object} date with any format
	 * @return {String} a valid UNIX timestamp
	 */
	TimelyUi.utils.toTimestamp = function(date) {
		return moment(date).format('X');
	};
})(TimelyUi);