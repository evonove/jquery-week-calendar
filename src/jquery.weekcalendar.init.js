'use strict';
var myScroll = myScroll || {};
var TimelyUi = TimelyUi || {};

TimelyUi.calendar = {};
TimelyUi.iScrollEls = {};
TimelyUi.slimScrollEl = {};
TimelyUi.columnsToShow = 5;
TimelyUi.maxColumnNumber = 5;
TimelyUi.actualNumberColumnToShow = TimelyUi.columnsToShow;
TimelyUi.currentUserId = 1;
TimelyUi.current = 0;

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
	});

	$(".go-right").click(function(e){
		var utils = TimelyUi.utils,
			maxPointerIndex = utils.getMaxPointerIndex();
		return utils.slidingUser(iScrolls, utils.slidingUserRight, maxPointerIndex);

	});
	$(".go-left").click(function(e){
		var utils = TimelyUi.utils,
			minPointerIndex = utils.getMinPointerIndex();
		return utils.slidingUser(iScrolls, utils.slidingUserLeft, minPointerIndex);
			
	});
	$(window).resize(function () {
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
	TimelyUi.calendar.conf = conf;
	TimelyUi.calendar.id = id;
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