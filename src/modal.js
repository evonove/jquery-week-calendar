'use strict';

(function($) {
	// Set timepicker
	var timeInterval = 60 / $('#calendar').weekCalendar().data('ui-weekCalendar').options.timeslotsPerHour;
	$('.timepicker').pickatime({
		interval: timeInterval
	});

	// Set datepicker
	$('input.datepicker').pickadate();
})(jQuery);