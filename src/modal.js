(function($) {
    'use strict';

    /* Modal initial configuration */
	TimelyUi.modal = TimelyUi.modal || {};

	var self = TimelyUi.modal,
		utils = TimelyUi.utils,
		timeInterval = 60 / 4,
        isMobile = TimelyUi.compat.isMobile,
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

                if(!isMobile){
                    /* Set all date and time widgets */
                    $('.modal-body .datepicker').pickadate();
                    $('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });
                }

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

            self.eventDate = self.createEventDate('.modal-body #eventDate');
            self.startTime = self.createEventTime('.modal-body #startTime');
            self.endTime = self.createEventTime('.modal-body #endTime');

            self.body = $('.modal-body #description');

			// Set all inputs with chosen event
			self.title.val(chosenEvent.title);
			self.userId.val(chosenEvent.userId);

            self.setDate(self.eventDate, chosenEvent.start);
            self.setTime(self.startTime, chosenEvent.start);
            self.setTime(self.endTime, chosenEvent.end);

			self.body.val(chosenEvent.body);
			return self;
		},

		save: function() {
			var self = this,
                calendar = TimelyUi.calendar,
                eventDate = this.getDate(this.eventDate);

			self.instance.options.calEvent = {
				id: self.instance.options.calEvent.id || eventId,
				title: self.title.val(),
				userId: parseInt(self.userId.val(), 10),
				start: this.getTime(eventDate, self.startTime),
				end: this.getTime(eventDate, self.endTime),
				body: self.body.val()
			};
            calendar.onSave(self.instance.options.calEvent);
			calendar.updateEvent(self.instance.options.calEvent);
			eventId += 1;
			return self;
		},

		delete: function() {
            var calendar = TimelyUi.calendar;

            calendar.onDelete(self.instance.options.calEvent.id);
			calendar.removeEvent(self.instance.options.calEvent.id);
			return this;
		},

        createEventDate: function(selector){
            var $obj = $(selector);
            if (!isMobile){
               $obj = $obj.pickadate('picker');
            }
            return $obj;
        },

        createEventTime: function(selector){
            var $obj = $(selector);
            if (!isMobile){
                $obj = $obj.pickatime('picker');
            }
            return $obj;
        },

        setDate: function($obj, date) {
            if (!isMobile){
                $obj.set('select', utils.toDate(date));
            } else {
                $obj.val(utils.formatDate(date, 'YYYY-MM-DD'));
            }
        },

        setTime: function($obj, time) {
            if (!isMobile){
                $obj.set('select', utils.timeToArray(time));
            } else {
                $obj.val(utils.formatDate(time, 'HH:mm'));
            }
        },

        getTime: function(date, $time) {
            if (!isMobile){
                return utils.datetimeISOFormat(date, $time.get('select', 'HH:i'));
            } else {
                return utils.datetimeISOFormat(date, $time.val());
            }
        },

        getDate: function($obj) {
            if (!isMobile){
                return utils.formatDate($obj.get('select').obj, 'MM-DD-YYYY');
            } else {
                return utils.formatDate($obj.val(), 'MM-DD-YYYY');
            }
        }
	});
})(jQuery);