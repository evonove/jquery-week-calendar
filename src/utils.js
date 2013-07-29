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

	/**
	 * Array.filter method is implemented in JavaScript 1.6, supported by most modern browsers.
	 * If for supporting the old browser, I wrote my one. 
	 */
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

	TimelyUi.utils._resetIScrolls = function(redim){
		var calendar = TimelyUi.calendar;
		// var redim = (redim === undefined) ? true : redim;
		redim = true;
		//TimelyUi.dispelVodooMagic();
		if( redim ){
			$.each(TimelyUi.iScrollEls, function(key, val){
				val.destroy();
			});
			TimelyUi.iScrollEls = {};
			TimelyUi.utils._resetHelperValues();
			TimelyUi.initIScrolls();
		}

		TimelyUi.boundIScrolls();
		if( redim ){
			TimelyUi.utils._redimColumnsWidth();
		}
		TimelyUi.vodooMagic();
		if( redim ){
			TimelyUi.calendar._scrollToHour(TimelyUi.calendar.options.date.getHours(), true);
		}
		
	};

	TimelyUi.utils._resetHelperValues = function(){
		var conf = TimelyUi.calendar.conf,
			loadedUsers = conf.loadedUsers;
		//Current index column used in sliding buttons features.
		//Changing resolution means restart from 0
		TimelyUi.current = 0;
		TimelyUi.currentUserId = loadedUsers[0].id;
		//Max number of column showable in widest resolutions
		//and actual columns to show
		TimelyUi.maxColumnNumber = TimelyUi.columnsToShow = TimelyUi.maxColumnNumber || TimelyUi.calendar.conf.maxColumnNumber || 5;
	};

	/***************************
	* Sliding users by buttons *
	****************************/
	TimelyUi.utils._goRight = function(e){
		var utils = TimelyUi.utils,
			maxPointerIndex = utils.getMaxPointerIndex();
		utils.slidingUser(TimelyUi.iScrollEls, utils.slidingUserRight, maxPointerIndex);
		e.preventDefault();
		return false;
	};

	TimelyUi.utils._goLeft = function(e){
		var utils = TimelyUi.utils,
			minPointerIndex = utils.getMinPointerIndex();
		utils.slidingUser(TimelyUi.iScrollEls, utils.slidingUserLeft, minPointerIndex);
		e.preventDefault();
		return false;
	};
	
	/**
	 * Used by .go-right click/.go-left click event.
	 */ 
	TimelyUi.utils._scrollToIfNeeded = function(iscroll, nextEl, pos, time, easing){
		time = time === undefined || null || time === 'auto' ? Math.max(Math.abs(pos.left)*2, Math.abs(pos.top)*2) : time;

		if (iscroll.lastPos === undefined || iscroll.lastPos.left !== pos.left || $(nextEl).css('display') === 'none'){
			iscroll.lastPos = pos;
			iscroll.lastIndexPointer = iscroll.pointerIndex;
			iscroll.scrollTo(pos.left, pos.top, time);
		} else {
			iscroll.pointerIndex = iscroll.lastIndexPointer;
		}
	};

	/**
	 * Used by .go-right click/.go-left click event.
	 */
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

	TimelyUi.utils._scrollBySelector = function(iscroll, selector){
		var utils = TimelyUi.utils;
		var el0 = document.querySelector(selector);
		var pos0 = utils._posByEl(iscroll, el0, false, false, -45, 0);
		utils._scrollToIfNeeded(iscroll, el0, pos0, 1000);
	};

	/**
	 * Slide user and column user-event clicking button on sides.
	 * The controller refresh indexPointer in some cases:
	 * - user hide one or more columns then slide right/left;
	 * - user show one or more columns then slide.
	 *
	 * TODO: Write a better code
	 */
	TimelyUi.utils._shiftIfNeeded = function(controller, pointerIndexLimit){
		var conf = TimelyUi.calendar.conf,
			utils = TimelyUi.utils,
			loadedUsers = conf.loadedUsers,
			removedUserId,
			removedUserIds = conf.removedUserIds,
			removedUserIdsLength = removedUserIds.length,
			current = TimelyUi.current,
			currentUser = utils._filter(loadedUsers, 'id', TimelyUi.currentUserId, true)[0],
			next = 0;

		for ( ; controller.checkForShifting(current) ; current = controller.increment(current)){
			if (currentUser.id === loadedUsers[current].id){
				for (var j = 0; j < removedUserIdsLength ; ++j){
					removedUserId = removedUserIds[j];
					if (removedUserId === currentUser.id){
						next = controller.increment(current);
						if (controller.checkForHidden(next, pointerIndexLimit)){
							TimelyUi.currentUserId = loadedUsers[next].id;
							console.log('it is hidden go next, ' + next);
							current = utils._shiftIfNeeded(controller, pointerIndexLimit);
						}
						return current;
					}
				}
				break;
			}
		}
		return current;
	};

	TimelyUi.utils._slidingUserStrategy = function(strategy) {
		return {
			refreshIfNoSufficientColumns : function(current, pointerIndexLimit) {
				return strategy.refreshIfNoSufficientColumns(current, pointerIndexLimit);
			},
			increment : function(current) {
				return strategy.increment(current);
			},
			checkForHidden : function(next, pointerIndexLimit) {
				return strategy.checkForHidden(next, pointerIndexLimit);
			},
			checkForShifting : function(current) {
				return strategy.checkForShifting(current);
			}
		};
	};

	TimelyUi.utils.slidingUserRight = {
		refreshIfNoSufficientColumns : function(current, pointerIndexLimit) {
			var conf = TimelyUi.calendar.conf,
				loadedUsers = conf.loadedUsers;
			if(current >= pointerIndexLimit){
				TimelyUi.current = pointerIndexLimit;
				TimelyUi.currentUserId = loadedUsers[pointerIndexLimit].id;
				console.log('out of bound set to '+TimelyUi.current+' '+loadedUsers[TimelyUi.current].username);
				return true;
			}
			return false;
		},
		increment : function(current) {
			return current + 1;
		},
		checkForHidden : function(next, pointerIndexLimit) {
			return (next <= pointerIndexLimit);
		},
		checkForShifting : function(current) {
			var conf = TimelyUi.calendar.conf,
				loadedUsers = conf.loadedUsers;
			return current < loadedUsers.length;
		}
	};

	TimelyUi.utils.slidingUserLeft = {
		refreshIfNoSufficientColumns : function(current, pointerIndexLimit) {
			var conf = TimelyUi.calendar.conf,
				loadedUsers = conf.loadedUsers;
			if(current <= pointerIndexLimit){
				TimelyUi.current = pointerIndexLimit;
				TimelyUi.currentUserId = loadedUsers[pointerIndexLimit].id;
				console.log('out of bound set to '+TimelyUi.current+' '+loadedUsers[TimelyUi.current].username);
				return true;
			}
			return false;
		},
		increment : function(current) {
			return current - 1;
		},
		checkForHidden : function(next, pointerIndexLimit) {
			return (next >= pointerIndexLimit);
		},
		checkForShifting : function(current) {
			return current > 0;
		}
	};

	TimelyUi.utils.slidingUser = function(iScrolls, strategy, pointerIndexLimit){
		var conf = TimelyUi.calendar.conf,
			utils = TimelyUi.utils,
			loadedUsers = conf.loadedUsers,
			removedUserId,
			removedUserIds = conf.removedUserIds,
			removedUserIdsLength = removedUserIds.length,
			controller = utils._slidingUserStrategy(strategy);

		console.log('---seek current---');
		console.log('starting is, '+TimelyUi.current+' '+loadedUsers[TimelyUi.current].username);
		var currentUser = utils._filter(loadedUsers, 'id', TimelyUi.currentUserId, true)[0];
		var current = utils._shiftIfNeeded(controller, pointerIndexLimit);
		if(current !== TimelyUi.current){
			currentUser = utils._filter(loadedUsers, 'id', TimelyUi.currentUserId, true)[0];
		}
		if(controller.refreshIfNoSufficientColumns(current, pointerIndexLimit)){
			utils._scrollBySelector(iScrolls[1], '.wc-time-slots td.wc-user-'+TimelyUi.currentUserId);
			utils._scrollBySelector(iScrolls[2], '#calendar-header-wrapper th.wc-user-'+TimelyUi.currentUserId);
			return false;
		}

		console.log('current is, '+current+' '+loadedUsers[current].username);
		console.log('---seek next---');
		var next = controller.increment(current);
		var nextUser = loadedUsers[next];
		if(controller.checkForHidden(next, pointerIndexLimit)){
			for (var j = 0; j< removedUserIdsLength ; ++j){
				removedUserId = removedUserIds[j];
				if (removedUserId === nextUser.id){
					next = controller.increment(current);
					TimelyUi.currentUserId = loadedUsers[next].id;
					next = utils._shiftIfNeeded(controller, pointerIndexLimit);
					nextUser = loadedUsers[next];
					break;
				}
			}
		}
		TimelyUi.current = next;
		TimelyUi.currentUserId = loadedUsers[next].id;

		controller.refreshIfNoSufficientColumns(current, pointerIndexLimit);
		console.log('next is, '+TimelyUi.current+' '+loadedUsers[TimelyUi.current].username);

		utils._scrollBySelector(iScrolls[1], '.wc-time-slots td.wc-user-'+TimelyUi.currentUserId);
		utils._scrollBySelector(iScrolls[2], '#calendar-header-wrapper th.wc-user-'+TimelyUi.currentUserId);
	};

	TimelyUi.utils.getMaxPointerIndex = function() {
		var conf = TimelyUi.calendar.conf,
			loadedUsers = conf.loadedUsers,
			arrayTds = $('td.wc-day-column:visible');

		arrayTds.pop = Array.prototype.pop;
		if (arrayTds.length < TimelyUi.columnsToShow && arrayTds.length === 0){
			return arrayTds.length;
		}
		for (var i = 0; i < TimelyUi.columnsToShow-1; ++i){
			arrayTds.pop();
		}
		try {
			var lastElement = arrayTds[arrayTds.length-1];
			var userId = parseInt(lastElement.className.split('wc-user-')[1].split(' ')[0], 10);
			for (var index = 0; index < loadedUsers.length; ++index){
				if (userId === loadedUsers[index].id){
					return index;
				}
			}
		} catch(err) {}
		return 0;
	};

	TimelyUi.utils.getMinPointerIndex = function() {
		var conf = TimelyUi.calendar.conf,
			loadedUsers = conf.loadedUsers,
			arrayTds = $('td.wc-day-column:visible');

		arrayTds.shift = Array.prototype.shift;
		if (arrayTds.length < TimelyUi.columnsToShow && arrayTds.length === 0){
			return arrayTds.length;
		}
		try {
			var lastElement = arrayTds.shift();
			var userId = parseInt(lastElement.className.split('wc-user-')[1].split(' ')[0], 10);
			for (var index = 0; index < loadedUsers.length; ++index){
				if (userId === loadedUsers[index].id){
					return index;
				}
			}
		} catch(err) {}
		return 0;
	};

	/************************************
	* Show hide user columns by buttons *
	*************************************/

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

		options.removedUserIds.push(userId);
		utils._addColSpan(false);
		utils._redimColumnsWidth();
	};

	/** 
	 * Show a single user in all widget, toggling the bounded button
	 * @param {int} userId is the id of user to show.
	 */
	TimelyUi.utils._showUserColumn = function(userId) {
		var options = TimelyUi.calendar.options,
			utils = TimelyUi.utils;

		options.removedUserIds.splice(options.removedUserIds.indexOf(userId),1);
		utils._addColSpan(true);
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
	
	/**
	 * Refresh the value of attr width in some DOM elements to render calendar widget correctly when users are added o removed.
	 * @param {Number} maxColumnNumber_ is the number of displayed user in same page by the widget. Default is 5.
	 */
	TimelyUi.utils._redimColumnsWidth = function() {
		var options = TimelyUi.calendar.options,
			width = $('#calendar-body-wrapper').width()-45, //the width of hiurday column
			maxColumnNumber = TimelyUi.maxColumnNumber;
		
		TimelyUi.columnsToShow = (maxColumnNumber > TimelyUi.columnsToShow) ? TimelyUi.columnsToShow : maxColumnNumber;

		var dividend = (options.users.length > TimelyUi.columnsToShow) ? TimelyUi.columnsToShow : options.users.length,
			rightSingleWidth = width/dividend,
			rightWidth = rightSingleWidth*options.users.length+45;
		
		TimelyUi.dispelVodooMagic();
		$('.scrollerWidth, .wc-time-slots').width(rightWidth);
		$('#scrollbar-wrapper').height($(window).height()-$('#first-row').height()-$('.calendar-header').height());
		$('table .ui-state-default, table .wc-user-header').not('.wc-grid-timeslot-header, .wc-time-column-header').each(function(index, el){
			$(this).width(rightSingleWidth);
		});
		$.each(TimelyUi.iScrollEls, function(key, val){
			val.refresh();
		});

		TimelyUi.vodooMagic();
		
	};

	TimelyUi.utils.toggleUserByButton = function(event, $button) {
		var userId = $button.data('user-id'),
			utils = TimelyUi.utils,
			$wcUser = $('.wc-user-' + userId);

		if ($wcUser.is(':visible')) {
			utils._hideUserColumn(userId);
		} else {
			utils._showUserColumn(userId);
		}

        $wcUser.toggle();
		$button.button('toggle');
	};


	TimelyUi.utils.disableIScrolls = function() {
		$.each(TimelyUi.iScrollEls, function(key, iscroll){
			iscroll.disable();
		});
	};

	TimelyUi.utils.enableIScrolls = function() {
		var event = jQuery.Event('mouseup');
		$.each(TimelyUi.iScrollEls, function(key, iscroll){
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