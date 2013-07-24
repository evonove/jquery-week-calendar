'use strict';
var myScroll = myScroll || {};
var TimelyUi = TimelyUi || {};

TimelyUi.calendar = TimelyUi.calendar || {};
TimelyUi.iScrollEls = TimelyUi.iScrollEls || {};

TimelyUi.initIScrolls  = function() {
	var iScrolls = TimelyUi.iScrollEls,
		utils = TimelyUi.utils;

	var iScroll = new IScroll('#scrollbar-wrapper', {
		scrollX: false,
		scrollY: true,
		momentum: true,
		// scrollbars: true, 
		mouseWheel: true, 
		// interactiveScrollbars: true,
		bounceEasing: 'elastic',
		bounceTime: 1200
	});
	TimelyUi.iScrollEls[0] = iScroll;

	var iScroll = new IScroll('#calendar-body-wrapper', {
		scrollX: true,
		scrollY: false,
		momentum: true,
		// scrollbars: true, 
		// mouseWheel: true, 
		// interactiveScrollbars: true,
		bounceEasing: 'elastic',
		bounceTime: 1200
	});
	TimelyUi.iScrollEls[1] = iScroll;

	var iScroll = new IScroll('#calendar-header-wrapper', {
		scrollX: true,
		scrollY: false,
		momentum: true,
		// scrollbars: true, 
		// mouseWheel: true, 
		// interactiveScrollbars: true,
		bounceEasing: 'elastic',
		bounceTime: 1200
	});
	TimelyUi.iScrollEls[2] = iScroll;



};

TimelyUi.boundIScrolls  = function() {
	var iScrolls = TimelyUi.iScrollEls,
		utils = TimelyUi.utils,
		goRight = utils._goRight,
		goLeft = utils._goLeft,
		events = TimelyUi.compat.events,
        on = TimelyUi.compat.on,
        off = TimelyUi.compat.off;
	

	$('.go-right').each(function(index, el){
		off($(el), events['click'], goRight);
		on($(el), events['click'], goRight);
	});

	$('.go-left').each(function(index, el){
		off($(el), events['click'], goLeft);
		on($(el), events['click'], goLeft);
	});

	$('[class^="scroller"]').each(function(index, el){
		var boundEvent = function(e) {
			$.each(TimelyUi.iScrollEls, function(key, val){
				if(key !== index){
					val.handleEvent(e);
				}
			});
			e.preventDefault();
		};

		var $el = $(el);
		off($el, events['move'], boundEvent);
		off($el, events['down'], boundEvent);
		off($el, events['cancel'], boundEvent);

		on($el, events['move'], boundEvent);
		on($el, events['down'], boundEvent);
		on($el, events['cancel'], boundEvent);

	});
	
};

TimelyUi.destroyIScrollEls = function(){
	TimelyUi.iScrollEls = {};
};

/**
 * TODO: Remove 'magic' behaviour
 */ 
TimelyUi.vodooMagic  = function() {
	//Needed (like "postion:absolute;" in scroller DOM element css) after initialization of IScroll to refresh correctly the layout of the page. MAH
	$('[class^="scroller"]').css('position', 'relative');
};

/**
 * TODO: Remove 'magic' behaviour
 */ 
TimelyUi.dispelVodooMagic  = function() {
	$('[class^="scroller"]').css('position', 'absolute');
};

TimelyUi.init = function(id, conf) {
	TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
	TimelyUi.calendar.conf = conf;
	TimelyUi.calendar.id = id;
	TimelyUi.calendar.lastRefresh = new Date().getTime();
	TimelyUi.calendar.lastWidth = window.innerWidth;

	TimelyUi.utils._resetIScrolls();
	
	//TimelyUi.boundHourAndSlimScroll();

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
			var withRedim = TimelyUi.calendar.lastWidth !== window.innerWidth;
			TimelyUi.calendar.lastWidth = window.innerWidth;
			TimelyUi.utils._resetIScrolls(withRedim);
			return false;
		}
	};
	// var newHeight = $('.scrollerHeight').height()-($(window).height()-100);
	// $('#scrollbar-wrapper').height(newHeight);

	// $('#calendar-body-wrapper, .scrollerWidth').width(TimelyUi.rightWidth);

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
