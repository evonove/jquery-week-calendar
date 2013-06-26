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
		timeInterval = 60 / calendar.options.timeslotsPerHour,
		eventId = 1; // TODO: remove this because it should be known by AngularJS

	/* Attach inputs and functions to bootstrap modal object */
	$.extend(modal, {
		userSelect: $('.modal #user'),
		title: $('.modal-header #title'),
		userId: $('.modal-body #user'),
		body: $('.modal-body #description'),

		clear: function() {
			this.title.val('');
			this.body.val('');
			calendar.removeUnsavedEvents();
			delete this.options.calEvent;
			return this;
		},

		load: function() {
			this.userId.val(this.options.calEvent.userId);
			utils.setDateValue(('startDate'), this.options.calEvent.start);
			utils.setTimeValue(('startTime'), this.options.calEvent.start);
			utils.setDateValue(('endDate'), this.options.calEvent.end);
			utils.setTimeValue(('endTime'), this.options.calEvent.end);
			return this;
		},

		save: function() {
			this.options.calEvent = {
				id: eventId,
				title: this.title.val(),
				userId: parseInt(this.userId.val(), 10),
				start: utils.datetimeISOFormat(utils.getDateValue('startDate'), utils.getTimeValue('startTime')),
				end: utils.datetimeISOFormat(utils.getDateValue('endDate'), utils.getTimeValue('endTime')),
				body: this.body.val()
			};

			calendar.updateEvent(this.options.calEvent);
			eventId += 1; // TODO: remove this because it should be known by AngularJS
			return this;
		}
	});

	/* Load users dynamically */
	$.each(calendar.options.users, function(index, user) {
		modal.userSelect.append('<option value="{0}">{1}</option>'.format(user.id, user.name));
	});

	/* Set all date and time widgets */
	$('.modal-body .datepicker').pickadate();
	$('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });

	/* Save current event */
	$('.modal-footer #modalSave').click(function() {
		modal.save().hide();
	});

	/* Twitter bootstrap events handler */
	modal.$element.on('show', function(event) {
		if (typeof modal.options.calEvent === 'undefined') {
			return event.preventDefault();
		} else {
			modal.load();
		}
	});

	modal.$element.on('shown', function(event) {
		modal.title.focus();
	});

	modal.$element.on('hide', function(event) {
		modal.clear();
	});
})(jQuery);