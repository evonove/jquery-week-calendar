'use strict';

var TimelyUi = TimelyUi || {};
TimelyUi.calendar = {};

TimelyUi.init = function(id, conf) {
	TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
};