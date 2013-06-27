'use strict';

/**
 * Modal manager which creates, updates and deletes selected event
 */
(function($) {
	/* Create and register modal object */
	TimelyUi.modal = $('#ajax-modal').modal({ show: false }).data('modal');

	var calendar = TimelyUi.calendar,
		utils = TimelyUi.utils,
		self = TimelyUi.modal,
		timeInterval = 60 / calendar.options.timeslotsPerHour,
		eventId = 1; // TODO: remove this because it should be known by AngularJS

	/* Attach inputs and functions to bootstrap modal object */
	$.extend(self, {
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
			var chosenEvent = this.options.calEvent,
				deleteButton = $('.modal-footer #modalDelete');

			// Disable/Enable delete button if chosen event is already persisted
			if (!!chosenEvent.id) {
				deleteButton.show();
			} else {
				deleteButton.hide();
			}

			// Set all inputs with chosen event
			this.title.val(chosenEvent.title);
			this.userId.val(chosenEvent.userId);
			utils.setDateValue(('startDate'), chosenEvent.start);
			utils.setTimeValue(('startTime'), chosenEvent.start);
			utils.setDateValue(('endDate'), chosenEvent.end);
			utils.setTimeValue(('endTime'), chosenEvent.end);
			this.body.val(chosenEvent.body);
			return this;
		},

		save: function() {
			this.options.calEvent = {
				id: this.options.calEvent.id || eventId,
				title: this.title.val(),
				userId: parseInt(this.userId.val(), 10),
				start: utils.datetimeISOFormat(utils.getDateValue('startDate'), utils.getTimeValue('startTime')),
				end: utils.datetimeISOFormat(utils.getDateValue('endDate'), utils.getTimeValue('endTime')),
				body: this.body.val()
			};

			calendar.updateEvent(this.options.calEvent);
			eventId += 1; // TODO: remove this because it should be known by AngularJS
			return this;
		},

		delete: function() {
			calendar.removeEvent(this.options.calEvent.id);
			return this;
		}
	});

	/* Load users dynamically */
	$.each(calendar.options.users, function(index, user) {
		self.userSelect.append('<option value="{0}">{1}</option>'.format(user.id, user.name));
	});

	/* Set all date and time widgets */
	$('.modal-body .datepicker').pickadate();
	$('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });

	/* Buttons listeners */
	$('.modal-footer #modalSave').click(function() {
		self.save().hide();
	});

	$('.modal-footer #modalDelete').click(function() {
		self.delete().hide();
	});

	/* Twitter bootstrap events handler */
	self.$element.on('show', function() {
		self.load();
	});

	self.$element.on('shown', function() {
		self.title.focus();
	});

	self.$element.on('hide', function() {
		self.clear();
	});
})(jQuery);