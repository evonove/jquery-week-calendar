(function($) {
    'use strict';

    /* Modal initial configuration */
	TimelyUi.modal = TimelyUi.modal || {};

	var self = TimelyUi.modal,
		utils = TimelyUi.utils,
		timeInterval = 60 / 4,
        isMobile = TimelyUi.compat.isMobile;

	$.extend(self, {
        init: function(selector, users, organizations) {
            if (typeof self.instance === 'undefined') {
                /* Create and register modal object */
                self.instance = selector.modal({ show: false }).data('modal');

                /* Load users and organizations dynamically */
                self.organizationSelect = $('.modal-body #organization');
                self.ownerSelect = $('.modal-body #owner');
                self.userSelect = $('.modal-body #user');

                $.each(users, function(index, user) {
                    self.ownerSelect.append('<option value="{0}">{1}</option>'.format(user.id, user.username));
                    self.userSelect.append('<option value="{0}">{1}</option>'.format(user.id, user.username));
                });

                $.each(organizations, function(index, organization) {
                    self.organizationSelect.append('<option value="{0}">{1}</option>'.format(organization.id, organization.name));
                });

                if(!isMobile){
                    /* Set all date and time widgets */
                    $('.modal-body .datepicker').pickadate({ format: 'dd/mm/yyyy' });
                    $('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });
                }

                /* Component listeners */
                $('.modal-body #organization').change(function(e) {
                    if ($(this).val() === String(null)) {
                        self.userSelect.attr('disabled', 'disabled');
                        self.userSelect.val(self.ownerSelect.val());
                    } else {
                        self.userSelect.removeAttr('disabled');
                    }
                });

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
			self.content.val('');
			TimelyUi.calendar.removeUnsavedEvents();
			delete self.instance.options.calEvent;
			return self;
		},

		load: function() {
			var calendar = TimelyUi.calendar,
                chosenEvent = this.instance.options.calEvent,
				deleteButton = $('.modal-footer #modalDelete');

			// Disable/Enable delete button if chosen event is already persisted
			if (!!chosenEvent.id) {
				deleteButton.show();
			} else {
				deleteButton.hide();
			}

            /* Assign all selector to local variables */
            self.organizationSelect = $('.modal-body #organization');
            self.ownerSelect = $('.modal-body #owner');
            self.userSelect = $('.modal-body #user');
            self.title = $('.modal-header #title');

            self.eventDate = self.createEventDate('.modal-body #eventDate');
            self.startTime = self.createEventTime('.modal-body #startTime');
            self.endTime = self.createEventTime('.modal-body #endTime');

            self.content = $('.modal-body #description');

			// Set all inputs with chosen event
			self.title.val(chosenEvent.title);
            if (chosenEvent.organization === null) {
                self.userSelect.attr('disabled', 'disabled');
                self.organizationSelect.val(String(null));
            } else {
                self.userSelect.removeAttr('disabled');
                self.organizationSelect.val(chosenEvent.organization || String(calendar.options.currentUser.defaultOrganization));
            }

            self.ownerSelect.val(chosenEvent.owner || calendar.options.currentUser.id);
			self.userSelect.val(chosenEvent.userId);

            self.setDate(self.eventDate, chosenEvent.start);
            self.setTime(self.startTime, chosenEvent.start);
            self.setTime(self.endTime, chosenEvent.end);

			self.content.val(chosenEvent.content);
			return self;
		},

		save: function() {
			var self = this,
                calendar = TimelyUi.calendar,
                eventDate = this.getDate(this.eventDate);

			self.instance.options.calEvent = {
				id: self.instance.options.calEvent.id || calendar.getLastEventId(),
				title: self.title.val(),
                organization: self.organizationSelect.val(),
                owner: parseInt(self.ownerSelect.val(), 10),
                userId: parseInt(self.userSelect.val(), 10),
				start: this.getTime(eventDate, self.startTime),
				end: this.getTime(eventDate, self.endTime),
				content: self.content.val()
			};
            calendar.onSave(self.instance.options.calEvent);
			return self;
		},

		delete: function() {
            var calendar = TimelyUi.calendar;

            calendar.onDelete(self.instance.options.calEvent);
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