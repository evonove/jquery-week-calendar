'use strict';
var myScroll = myScroll || {};
var TimelyUi = TimelyUi || {};

TimelyUi.calendar = {};
TimelyUi.elIScrolls = {};
TimelyUi.columnsToShow = 5;

TimelyUi.initIScrolls  = function() {
	var iScrolls = TimelyUi.elIScrolls;
	var utils = TimelyUi.utils;
	var maxPointerIndex = TimelyUi.calendar.options.users.length - Math.ceil(TimelyUi.columnsToShow/2);
	$('.wrapper').each(function(index, el){
		var iScroll = new IScroll(el, {
			scrollX: true,
			scrollY: false,
			momentum: true,
			bounceEasing: 'elastic', 
			bounceTime: 1200
		});
		TimelyUi.elIScrolls[index] = iScroll;
		switch (index) {
			case 0: //username IScroll
				//break;
			case 1: //day IScroll
				//break;
			default:
				iScroll.pointerIndex = 2;
				iScroll.lastPos = { 'left':undefined, 'top':undefined};
				iScroll.lastIndexPointer = undefined;
		}
	});
	$(".go-right").click(function(e){
		var scrollerEl = document.querySelector('#calendar-header-wrapper .scroller');
		var el0 = {};
		
		if (iScrolls[0].lastIndexPointer !== undefined && $(scrollerEl.querySelector('th:nth-child('+iScrolls[0].lastIndexPointer+')')).css('display') == 'none'){
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex += 1;
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex > maxPointerIndex) ? maxPointerIndex : iScrolls[0].pointerIndex;
		}
		do {
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex += 1;
			el0 = scrollerEl.querySelector('th:nth-child('+iScrolls[0].pointerIndex+')');
		} while ($(el0).css('display') == 'none' && iScrolls[0].pointerIndex < maxPointerIndex);
		
		iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex > maxPointerIndex) ? maxPointerIndex : iScrolls[0].pointerIndex;

		var pos0 = utils._posByEl(iScrolls[0], el0, false, false, -45, 0);
		utils._scrollToIfNeeded(iScrolls[0], pos0, 1000);
		
		var el1 = document.querySelector('.wc-grid-row-events td:nth-child('+iScrolls[1].pointerIndex+')');
		var pos1 = utils._posByEl(iScrolls[1], el1, false, false, -45, 0);
		utils._scrollToIfNeeded(iScrolls[1], pos1, 1000);
	});
	$(".go-left").click(function(e){
		var scrollerEl = document.querySelector('#calendar-header-wrapper .scroller');
		var el0 = {};
		
		if (iScrolls[0].lastIndexPointer !== undefined && $(scrollerEl.querySelector('th:nth-child('+iScrolls[0].lastIndexPointer+')')).css('display') == 'none'){
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex -= 1;
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex < 2) ? 2 : iScrolls[0].pointerIndex;
		}
		do {
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex -= 1;
			el0 = scrollerEl.querySelector('th:nth-child('+iScrolls[0].pointerIndex+')');
		} while ($(el0).css('display') == 'none' && iScrolls[0].pointerIndex > 2);

		iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex < 2) ? 2 : iScrolls[0].pointerIndex;

		var pos0 = utils._posByEl(iScrolls[0], el0, false, false, -45, 0);
		utils._scrollToIfNeeded(iScrolls[0], pos0, 1000);

		var el1 = document.querySelector('.wc-grid-row-events td:nth-child('+iScrolls[1].pointerIndex+')');
		var pos1 = utils._posByEl(iScrolls[1], el1, false, false, -45, 0);
		utils._scrollToIfNeeded(iScrolls[1], pos1, 1000);
	});
};

TimelyUi.boundIScrolls  = function() {
	$('.scroller').each(function(index, el){
		el.addEventListener('mousemove', function (e) {
			$.each(TimelyUi.elIScrolls, function(key, val){
				if(key !== index){
					val.handleEvent(e);
				}
			});
			e.preventDefault();
		}, false);
		el.addEventListener('mousedown', function (e) {
			$.each(TimelyUi.elIScrolls, function(key, val){
				if(key !== index){
					val.handleEvent(e);
				}
			});
		}, false);
		el.addEventListener('mousecancel', function (e) {
			$.each(TimelyUi.elIScrolls, function(key, val){
				if(key !== index){
					val.handleEvent(e);
				}
			});
		}, false);
	});
	TimelyUi.utils._redimColumnsWidth();
};

/* TODO: Remove 'magic' behaviour */
TimelyUi.vodooMagic  = function() {
	//Needed (like "postion:absolute;" in scroller DOM element css) after initialization of IScroll to refresh correctly the layout of the page. MAH
	$('.scroller').css('position', 'relative');
};

/* TODO: Remove 'magic' behaviour */
TimelyUi.dispelVodooMagic  = function() {
	$('.scroller').css('position', 'absolute');
};

TimelyUi.init = function(id, conf) {
	TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
	TimelyUi.initIScrolls();
	TimelyUi.boundIScrolls();
	TimelyUi.vodooMagic();
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
};