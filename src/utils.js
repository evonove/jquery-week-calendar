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
	   If for supporting the old browser, I wrote my one. */
	TimelyUi.utils._filter = function(array, attrName, attrValue, likeQuery) {
		if (!likeQuery){
			likeQuery = false;
		}
		try {
			var endArray = array.filter(function(el) {
				var returnValue = (likeQuery) ? el[attrName] === attrValue : el[attrName] !== attrValue;
				return returnValue;
			});
			return endArray;
		} catch(err) {
			var endArray = array;
			$.each(array, function(index, obj) {
				if (likeQuery){
					if (obj[attrName] !== attrValue) {
						endArray.splice(index, 1);
					}
				} else {
					if (obj[attrName] === attrValue) {
						endArray.splice(index, 1);
					}
				}
			});
			return endArray;
		}
	};

	/**
	 * Refresh the value of attr colspan in two DOM elements to render calendar widget correctly when users are added o removed.
	 * Add a colspan means less users.
	 * @param {boolean} isAdd must be true when an user is added
	 */
	TimelyUi.utils._addColSpan = function(isAdd) {
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
	 * Hide a single user in all widget, toggling the bounded button
	 * @param {int} userId is the id of user to hide.
	 */
	TimelyUi.utils._hideUserColumn = function(userId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils;
			
		options.removedUserIds.splice(options.removedUserIds.indexOf(userId),1);
		utils._addColSpan(true);
		utils._redimColumnsWidth();
	};

	/** 
	 * Show a single user in all widget, toggling the bounded button
	 * @param {int} userId is the id of user to show.
	 */
	TimelyUi.utils._showUserColumn = function(userId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils;

		options.removedUserIds.push(userId);
		utils._addColSpan(false);
		utils._redimColumnsWidth();
	};

	TimelyUi.utils._offset = function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		// jshint -W084
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		// jshint +W084

		return {
			left: left,
			top: top
		};
	};

	TimelyUi.utils._scrollToIfNeeded = function(iscroll, pos, time, easing){
		time = time === undefined || null || time == 'auto' ? Math.max(Math.abs(pos.left)*2, Math.abs(pos.top)*2) : time;

		if (iscroll.lastPos === undefined || iscroll.lastPos.left !== pos.left){
			iscroll.lastPos = pos;
			iscroll.lastIndexPointer = iscroll.pointerIndex;
			iscroll.scrollTo(pos.left, pos.top, time);
		} else {
			iscroll.pointerIndex = iscroll.lastIndexPointer;
		}
	}

	TimelyUi.utils._posByEl = function(iscroll, el, offsetX, offsetY, pxOffsetX, pxOffsetY){
		el = el.nodeType ? el : iscroll.scroller.querySelector(el);
		
		if ( !el ) {
			return;
		}
		var pos = TimelyUi.utils._offset(el);

		pos.left -= iscroll.wrapperOffset.left;
		pos.top  -= iscroll.wrapperOffset.top;

		// if offsetX/Y are true we center the element to the screen
		if ( offsetX === true ) {
			offsetX = Math.round(el.offsetWidth / 2 - iscroll.wrapper.offsetWidth / 2);
		}
		if ( offsetY === true ) {
			offsetY = Math.round(el.offsetHeight / 2 - iscroll.wrapper.offsetHeight / 2);
		}

		pos.left -= offsetX || 0;
		pos.top  -= offsetY || 0;

		pos.left -= pxOffsetX || 0;
		pos.top  -= pxOffsetY || 0;

		pos.left = pos.left > 0 ? 0 : pos.left < iscroll.maxScrollX ? iscroll.maxScrollX : pos.left;
		pos.top  = pos.top  > 0 ? 0 : pos.top  < iscroll.maxScrollY ? iscroll.maxScrollY : pos.top;

		return pos;
	};

	/**
	 * Refresh the value of attr width in some DOM elements to render calendar widget correctly when users are added o removed.
	 * @param {Number} maxColumnNumber_ is the number of displayed user in same page by the widget. Default is 5.
	 */
	TimelyUi.utils._redimColumnsWidth = function(maxColumnNumber_) {
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

	TimelyUi.utils.toggleUserByButton = function(event, $button) {
		var userId = $button.data('user-id'),
			utils = TimelyUi.utils,
			$wcUser = $('.wc-user-' + userId);

		$wcUser.toggle();
		if ($wcUser.is(':visible')) {
			utils._hideUserColumn(userId);
		} else {
			utils._showUserColumn(userId);
		}
		$button.button('toggle');
	};


	TimelyUi.utils.disableIScrolls = function() {
		$.each(TimelyUi.elIScrolls, function(key, iscroll){
			iscroll.disable();
		});
	};

	TimelyUi.utils.enableIScrolls = function() {
		var event = jQuery.Event('mouseup');
		$.each(TimelyUi.elIScrolls, function(key, iscroll){
			iscroll.enable();
			iscroll.handleEvent(event);
		});
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

	/** 
	 * Show a single user in all widget, toggling the bounded button
	 * @param {int} userId is the id of user to show.
	 */
	// TimelyUi.utils.hideUsers = function(organizationId) {
	// 	var options = TimelyUi.calendar.options,
	// 		utils = TimelyUi.utils,
	// 		filter = TimelyUi.utils._filter,
	// 		endArray = [];
			
	// 	endArray = filter(options.organizations, 'id', organizationId);
	// 	if ( endArray.length == 1 ){
	// 		var organization = endArray[0];
	// 		$.each(organization.users, function(index, userId){
	// 			var event = jQuery.Event('click');
	// 			var $button = $('button[data-user-id="'+userId+'"]');
	// 			if ($button.hasClass('active')){
	// 				utils.toggleUserByButton(event, $button);
	// 			}
	// 		});
	// 	}
	// };

	/** 
	 * Show a multiple users in all widget, toggling the bounded organization button
	 * @param {int} organizationId is the id of organization to show, included all linked users.
	 */
	TimelyUi.utils.showUsers = function(organizationId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils,
			filter = TimelyUi.utils._filter,
			endArray = [];

		endArray = filter(options.organizations, 'id', organizationId, true);
		if ( endArray.length === 1 ){
			var organization = endArray[0];
			$.each(organization.users, function(index, userId){
				var event = jQuery.Event('click');
				var $button = $('button[data-user-id="'+userId+'"]');
				if (!$button.hasClass('active')){
					utils.toggleUserByButton(event, $button);
				}
			});
		}
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