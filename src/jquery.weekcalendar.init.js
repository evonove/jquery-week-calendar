'use strict';
var myScroll = myScroll || {};
var TimelyUi = TimelyUi || {};

TimelyUi.calendar = {};
TimelyUi.iScrollEls = {};
TimelyUi.slimScrollEl = {};
TimelyUi.columnsToShow = 5;
TimelyUi.maxColumnNumber = 5;
TimelyUi.actualNumberColumnToShow = TimelyUi.columnsToShow;

TimelyUi.initIScrolls  = function() {
	var iScrolls = TimelyUi.iScrollEls;
	var utils = TimelyUi.utils;
	
	$('.wrapper').each(function(index, el){
		var iScroll = new IScroll(el, {
			scrollX: true,
			scrollY: false,
			momentum: true,
			bounceEasing: 'elastic', 
			bounceTime: 1200
		});
		TimelyUi.iScrollEls[index] = iScroll;
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
		// window.addEventListener('onorientationchange' in window ? 'orientationchange' : 'resize', resizeContent, false);
		// function resizeContent() { 
		// 	setTimeout(function () { 
		// 		console.log('window resize');
		// 		$.each(TimelyUi.iScrollEls, function(key, val){
		// 			val.disable();
		// 			val._init();
		// 			val.refresh();
		// 			val.enable();
		// 		});
		// 	},5000);
		// }
	});
	/* Slide user and column user-event clicking button on sides.
	 * The controller refresh indexPointer in some cases:
	 * - user hide one or more columns then slide right/left;
	 * - user show one or more columns then slide.
	 *
	 * TODO: Write a better code
	 */
	$(".go-right").click(function(e){
		var scrollerEl = document.querySelector('#calendar-header-wrapper .scroller');
		var el0 = {};
		var maxPointerIndex = TimelyUi.utils.getMaxPointerIndex();
		
		if (iScrolls[0].lastIndexPointer !== undefined && $(scrollerEl.querySelector('th:nth-child('+iScrolls[0].lastIndexPointer+')')).css('display') == 'none'){
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex += 1;
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex > maxPointerIndex) ? maxPointerIndex : iScrolls[0].pointerIndex;
		}
		do {
			iScrolls[0].pointerIndex = iScrolls[1].pointerIndex += 1;
			el0 = scrollerEl.querySelector('th:nth-child('+iScrolls[0].pointerIndex+')');
		} while ($(el0).css('display') == 'none' && iScrolls[0].pointerIndex < maxPointerIndex);
		
		iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex > maxPointerIndex) ? maxPointerIndex : iScrolls[0].pointerIndex;

		var pos0 = utils._posByEl(iScrolls[0], el0, false, false, -45, 0);  // first column is for HoursDay
		utils._scrollToIfNeeded(iScrolls[0], el0, pos0, 1000);
		
		var el1 = document.querySelector('.wc-grid-row-events td:nth-child('+iScrolls[1].pointerIndex+')');
		var pos1 = utils._posByEl(iScrolls[1], el1, false, false, -45, 0);
		utils._scrollToIfNeeded(iScrolls[1], el0, pos1, 1000);
		console.log('maxPointerIndex '+maxPointerIndex+', iScrolls[0].lastIndexPointer '+iScrolls[0].lastIndexPointer+', iScrolls[0].pointerIndex '+iScrolls[0].pointerIndex);
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
		} while ($(el0).css('display') == 'none' && iScrolls[0].pointerIndex > 2); // first column is for HoursDay

		iScrolls[0].pointerIndex = iScrolls[1].pointerIndex = (iScrolls[0].pointerIndex < 2) ? 2 : iScrolls[0].pointerIndex;

		var pos0 = utils._posByEl(iScrolls[0], el0, false, false, -45, 0); // 45 px is the offset for HoursDay
		utils._scrollToIfNeeded(iScrolls[0], el0, pos0, 1000);

		var el1 = document.querySelector('.wc-grid-row-events td:nth-child('+iScrolls[1].pointerIndex+')');
		var pos1 = utils._posByEl(iScrolls[1], el1, false, false, -45, 0);
		utils._scrollToIfNeeded(iScrolls[1], el1, pos1, 1000);
		console.log('iScrolls[0].pointerIndex '+iScrolls[0].pointerIndex+', iScrolls[1].pointerIndex '+iScrolls[1].pointerIndex);
	});
	$(window).resize(function () {
		// $.each(TimelyUi.iScrollEls, function(key, val){
		// 	val.disable();
		// 	val._init();
		// 	val.refresh();
		// 	val.enable();
		// });
		$.each(TimelyUi.iScrollEls, function(key, val){
				val.destroy();
		});
		TimelyUi.iScrollEls = {};
		TimelyUi.initIScrolls();
		TimelyUi.boundIScrolls();
		TimelyUi.vodooMagic();
		
	});
};

TimelyUi.boundIScrolls  = function() {
	$('.scroller').each(function(index, el){
		function boundEvent(e) {
			$.each(TimelyUi.iScrollEls, function(key, val){
				if(key !== index){
					val.handleEvent(e);
				}
			});
			e.preventDefault();
		}
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
}
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
};