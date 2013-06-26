'use strict';

/**
 * Modal manager which creates, updates and deletes selected event
 */
(function($) {
	/* Set all date and time widgets */
	var calendar = TimelyUi.calendar,
		utils = TimelyUi.utils,
		timeInterval = 0,
		id = 0; // TODO: it should be known by AngularJS

	timeInterval = 60 / calendar.options.timeslotsPerHour;
	$('.datepicker').pickadate();
	$('.timepicker').pickatime({ interval: timeInterval, format: 'H:i' });

	/* Twitter bootstrap events handler */
	$('#ajax-modal').on('show', function(event) {
		var self = $('#' + event.target.id).data('modal');
		if (typeof self.options.calEvent === 'undefined') {
			return event.preventDefault();
		} else {
			// Set values to inputs
			utils.setDateValue(('startDate'), self.options.calEvent.start);
			utils.setTimeValue(('startTime'), self.options.calEvent.start);
			utils.setDateValue(('endDate'), self.options.calEvent.end);
			utils.setTimeValue(('endTime'), self.options.calEvent.end);
		}
	});

	$('#ajax-modal').on('hide', function(event) {
		var self = $('#' + event.target.id).data('modal');

		delete self.options.calEvent;
		calendar.removeUnsavedEvents();
	});
})(jQuery);