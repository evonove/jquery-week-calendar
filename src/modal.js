'use strict';

/**
 * Modal manager which creates, updates and deletes selected event
 */
(function($) {
	/* Create and register modal object */
	TimelyUi.calendar.modal = $('#ajax-modal').modal({ show: false }).data('modal');

	var calendar = TimelyUi.calendar,
		utils = TimelyUi.utils,
		modal = calendar.modal,
		timeInterval = 0,
		eventId = 1; // TODO: remove this because it should be known by AngularJS

	/* Set all date and time widgets */
	timeInterval = 60 / calendar.options.timeslotsPerHour;
	$('.modal-body .datepicker').pickadate();
	$('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });

	/* Save current event */
	$('.modal-footer #modalSave').click(function() {
		var calEvent = {
			id: eventId,
			title: $('.modal-header #title').val(),
			userId: parseInt($('.modal-body #user').val(), 10),
			start: utils.datetimeISOFormat(utils.getDateValue('startDate'), utils.getTimeValue('startTime')),
			end: utils.datetimeISOFormat(utils.getDateValue('endDate'), utils.getTimeValue('endTime')),
			body: $('.modal-body #description').val()
		};

		calendar.updateEvent(calEvent);
		eventId += 1; // TODO: remove this because it should be known by AngularJS

		modal.hide();
	});

	/* Twitter bootstrap events handler */
	modal.$element.on('show', function(event) {
		if (typeof modal.options.calEvent === 'undefined') {
			return event.preventDefault();
		} else {
			// Set input values in modal form
			$('.modal-body #user').val(modal.options.calEvent.userId);
			utils.setDateValue(('startDate'), modal.options.calEvent.start);
			utils.setTimeValue(('startTime'), modal.options.calEvent.start);
			utils.setDateValue(('endDate'), modal.options.calEvent.end);
			utils.setTimeValue(('endTime'), modal.options.calEvent.end);
		}
	});

	modal.$element.on('hide', function(event) {
		delete modal.options.calEvent;
		calendar.removeUnsavedEvents();
	});
})(jQuery);