'use strict';

/**
 * Modal manager which creates, updates and deletes selected event
 */
(function($) {
	/* Set all date and time widgets */
	var $weekCalendar = $('#calendar').weekCalendar().data('ui-weekCalendar');
	var timeInterval;

	timeInterval = 60 / $weekCalendar.options.timeslotsPerHour;
	$('.datepicker').pickadate();
	$('.timepicker').pickatime({ interval: timeInterval, format: 'H:i' });

	/* Twitter bootstrap events handler */
	$('#ajax-modal').on('show', function(event) {
		var self = $('#' + event.target.id).data('modal');
		if (typeof self.options.calEvent === 'undefined') {
			return event.preventDefault();
		} else {
			// Set values to inputs
			setDateValue($('#startDate'), self.options.calEvent.start);
			setTimeValue($('#startTime'), self.options.calEvent.start);
			setDateValue($('#endDate'), self.options.calEvent.end);
			setTimeValue($('#endTime'), self.options.calEvent.end);
		}
	});

	$('#ajax-modal').on('hide', function(event) {
		var self = $('#' + event.target.id).data('modal');

		delete self.options.calEvent;
		$('#calendar').weekCalendar('removeUnsavedEvents');
	});
})(jQuery);