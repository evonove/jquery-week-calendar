'use strict';
var myScroll = myScroll || {};
var TimelyUi = TimelyUi || {};

TimelyUi.calendar = {};
TimelyUi.elIScrolls = {};
TimelyUi.columnsToShow = 5;

TimelyUi.initIScrolls  = function() {
	$('.wrapper').each(function(index, el){
		var iScroll = new IScroll(el, {
			scrollX: true,
			scrollY: false,
			momentum: false
		});
		TimelyUi.elIScrolls[el.id] = iScroll;
	});
};
TimelyUi.boundIScrolls  = function() {
	$('.scroller').each(function(index, el){
		el.addEventListener('mousemove', function (e) {
			$.each(TimelyUi.elIScrolls, function(key, val){
				if(key !== el.parentElement.id){
					val.handleEvent(e);
				}
			});
			e.preventDefault();
		}, false);
		el.addEventListener('mousedown', function (e) {
			$.each(TimelyUi.elIScrolls, function(key, val){
				if(key !== el.parentElement.id){
					val.handleEvent(e);
				}
			});
		}, false);
		el.addEventListener('mousecancel', function (e) {
			$.each(TimelyUi.elIScrolls, function(key, val){
				if(key !== el.parentElement.id){
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