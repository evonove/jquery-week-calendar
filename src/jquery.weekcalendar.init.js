'use strict';
var myScroll = myScroll || {};
var TimelyUi = TimelyUi || {};

TimelyUi.calendar = TimelyUi.calendar || {};
TimelyUi.iScrollEls = TimelyUi.iScrollEls || {};
TimelyUi.slimScrollEl = TimelyUi.slimScrollEl || {};

TimelyUi.initIScrolls  = function() {
	var iScrolls = TimelyUi.iScrollEls,
		utils = TimelyUi.utils;
	
	utils._resetHelperValues();

	$('.wrapper').each(function(index, el){
		var iScroll = new IScroll(el, {
			scrollX: true,
			scrollY: false,
			momentum: true,
			bounceEasing: 'elastic',
			bounceTime: 1200
		});
		TimelyUi.iScrollEls[index] = iScroll;
	});
};

TimelyUi.boundIScrolls  = function() {
	var iScrolls = TimelyUi.iScrollEls,
		utils = TimelyUi.utils,
		goRight = utils._goRight,
		goLeft = utils._goLeft;
	
	$('.go-right').each(function(index, el){
		el.removeEventListener('click', goRight, false);
		el.addEventListener('click', goRight, false);
	});
	$('.go-left').each(function(index, el){
		el.removeEventListener('click', goLeft, false);
		el.addEventListener('click', goLeft, false);
	});
	$('.scroller').each(function(index, el){
		var boundEvent = function(e) {
			$.each(TimelyUi.iScrollEls, function(key, val){
				if(key !== index){
					val.handleEvent(e);
				}
			});
			e.preventDefault();
		};
		el.removeEventListener('mousemove', boundEvent, false);
		el.removeEventListener('mousedown', boundEvent, false);
		el.removeEventListener('mousedown', boundEvent, false);
		el.addEventListener('mousemove', boundEvent, false);
		el.addEventListener('mousedown', boundEvent, false);
		el.addEventListener('mousecancel', boundEvent, false);
	});
	TimelyUi.utils._redimColumnsWidth();
};

TimelyUi.destroyIScrollEls = function(){
	TimelyUi.iScrollEls = {};
};

TimelyUi.boundHourAndSlimScroll  = function() {
	var el = TimelyUi.slimScrollEl;
	el.mousePosition = {clientX:0,clientY:0};
	var dragging = false;
	$('.td-wrapper').mousedown(function(e){
		dragging = true;
		el.mousePosition = {
			clientX: e.clientX,
			clientY: e.clientY
		};
	});
	$('#day-hours').mousemove(function(e){
		if (dragging){
			var delta = el.mousePosition.clientY - e.clientY;
			el.slimScroll({ scrollBy: delta+'px' });
			el.mousePosition = {
				clientX: e.clientX,
				clientY: e.clientY
			};
		}
	});
	$('#day-hours').mouseup(function(e){
		dragging = false;
	});
	$('#day-hours').mouseout(function(e){
		dragging = false;
	});
};

/**
 * TODO: Remove 'magic' behaviour
 */ 
TimelyUi.vodooMagic  = function() {
	//Needed (like "postion:absolute;" in scroller DOM element css) after initialization of IScroll to refresh correctly the layout of the page. MAH
	$('.scroller').css('position', 'relative');
};

/**
 * TODO: Remove 'magic' behaviour
 */ 
TimelyUi.dispelVodooMagic  = function() {
	$('.scroller').css('position', 'absolute');
};

TimelyUi.init = function(id, conf) {
	TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
	TimelyUi.calendar.conf = conf;
	TimelyUi.calendar.id = id;
	TimelyUi.calendar.lastRefresh = new Date().getTime();

	TimelyUi.initIScrolls();
	TimelyUi.boundIScrolls();
	TimelyUi.vodooMagic();
	TimelyUi.boundHourAndSlimScroll();

	TimelyUi.calendar.options.eventDrag = function(calEvent, element) {
		TimelyUi.utils.disableIScrolls();
	};
	TimelyUi.calendar.options.eventDrop = function(calEvent, element) {
		TimelyUi.utils.enableIScrolls();
	};
	TimelyUi.calendar.options.eventMousedownNewEvent = function(calEvent, element) {
		TimelyUi.utils.disableIScrolls();
	};
	TimelyUi.calendar.options.eventMouseupNewEvent = function(calEvent, element) {
		TimelyUi.utils.enableIScrolls();
	};
	
	//http://stackoverflow.com/questions/13244667/window-resize-event-fires-twice-in-jquery
	window.onresize = function(e){
		if(e.originalEvent === undefined && e.timeStamp - TimelyUi.calendar.lastRefresh > 500){
			TimelyUi.utils._resetIScrolls();
		}
	};

	/**
	 * Register a callback for mobile view 
	 */
	enquire.register('screen and (max-width: 767px)', {
		match : function() {
			TimelyUi.calendar.lastRefresh = new Date().getTime();
			$('.wc-timeslot-placeholder').attr('colspan', 1);
			TimelyUi.maxColumnNumber = TimelyUi.columnsToShow = 1;
			setTimeout(TimelyUi.utils._resetIScrolls, 500);

		},
		unmatch : function() {
			TimelyUi.calendar.lastRefresh = new Date().getTime();
			$('.wc-timeslot-placeholder').attr('colspan', 4);
			TimelyUi.maxColumnNumber = TimelyUi.columnsToShow = 5;
			setTimeout(TimelyUi.utils._resetIScrolls, 500);
		}
	});

};
