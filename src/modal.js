(function($) {
    'use strict';

    /* Modal initial configuration */
	TimelyUi.modal = TimelyUi.modal || {};

	var self = TimelyUi.modal,
		utils = TimelyUi.utils,
		timeInterval = 60 / 4,
		eventId = 1;

	$.extend(self, {
        init: function(selector, users) {
            if (typeof self.instance === 'undefined') {
                /* Create and register modal object */
                self.instance = selector.modal({ show: false }).data('modal');

                /* Load users dynamically */
                self.userSelect = $('.modal #user');
                $.each(users, function(index, user) {
                    self.userSelect.append('<option value="{0}">{1}</option>'.format(user.id, user.username));
                });

                /* Set all date and time widgets */
                $('.modal-body .datepicker').pickadate();
                $('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });

                /* Buttons listeners */
                $('.modal-footer #modalSave').click(function(e) {
                    self.save();
                    self.instance.hide();
                    e.preventDefault();
                });

                $('.modal-footer #modalDelete').click(function(e) {
                    self.delete();
                    self.instance.hide();
                    e.preventDefault();
                });

                /* Twitter bootstrap events handler */
                self.instance.$element.on('show', function() {
                    self.load();
                });

                self.instance.$element.on('shown', function() {
                    self.title.focus();
                });

                self.instance.$element.on('hide', function() {
                    self.clear();
                });
            }
        },

		clear: function() {
            var self = this;

			self.title.val('');
			self.body.val('');
			TimelyUi.calendar.removeUnsavedEvents();
			delete self.instance.options.calEvent;
			return self;
		},

		load: function() {
			var chosenEvent = this.instance.options.calEvent,
				deleteButton = $('.modal-footer #modalDelete');

			// Disable/Enable delete button if chosen event is already persisted
			if (!!chosenEvent.id) {
				deleteButton.show();
			} else {
				deleteButton.hide();
			}

            /* Assign all selector to local variables */
            self.userSelect = $('.modal #user');
            self.title = $('.modal-header #title');
            self.userId = $('.modal-body #user');
            self.eventDate = $('.modal-body #eventDate').pickadate('picker');
            self.startTime = $('.modal-body #startTime').pickatime('picker');
            self.endTime = $('.modal-body #endTime').pickatime('picker');
            self.body = $('.modal-body #description');

			// Set all inputs with chosen event
			self.title.val(chosenEvent.title);
			self.userId.val(chosenEvent.userId);
			self.eventDate.set('select', utils.toDate(chosenEvent.start));
			self.startTime.set('select', utils.timeToArray(chosenEvent.start));
			self.endTime.set('select', utils.timeToArray(chosenEvent.end));
			self.body.val(chosenEvent.body);
			return self;
		},

		save: function() {
			var self = this,
                eventDate = utils.formatDate(this.eventDate.get('select').obj, 'MM-DD-YYYY');

			self.instance.options.calEvent = {
				id: self.instance.options.calEvent.id || eventId,
				title: self.title.val(),
				userId: parseInt(self.userId.val(), 10),
				start: utils.datetimeISOFormat(eventDate, self.startTime.get('select', 'HH:i')),
				end: utils.datetimeISOFormat(eventDate, self.endTime.get('select', 'HH:i')),
				body: self.body.val()
			};

			TimelyUi.calendar.updateEvent(self.instance.options.calEvent);
			eventId += 1;
			return self;
		},

		delete: function() {
			TimelyUi.calendar.removeEvent(self.instance.options.calEvent.id);
			return this;
		}
	});
})(jQuery);