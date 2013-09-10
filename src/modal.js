(function($) {
    'use strict';

    /* Modal initial configuration */
	TimelyUi.modal = TimelyUi.modal || {};

	var self = TimelyUi.modal,
		utils = TimelyUi.utils,
		timeInterval = 60 / 4,
        isMobile = TimelyUi.compat.isMobile;

	$.extend(self, {
        init: function(selector) {
            if (typeof self.instance === 'undefined') {
                /* Create and register modal object */
                self.instance = selector.modal({ show: false }).data('modal');

                /* Assign all selector to local variables */
                self.organizationSelect = $('.modal-body #organization');
                self.ownerSelect = $('.modal-body #owner');
                self.usersSelect = $('.modal-body #users').selectize({
                    plugins: ['remove_button'],
                    valueField: 'id',
                    labelField: 'username',
                    searchField: 'username'
                })[0].selectize;
                self.title = $('.modal-header #title');
                self.content = $('.modal-body #description');

                if(!isMobile){
                    /* Set all date and time widgets */
                    $('.modal-body .datepicker').pickadate({ format: 'dd/mm/yyyy' });
                    $('.modal-body .timepicker').pickatime({ interval: timeInterval, format: 'H:i' });
                }

                self.organizationSelect.on('change', function(e) {
                    var _value = $(this).val() === "null" ? null : parseInt($(this).val(), 10),
                        _users = self._getUsers(_value);

                    if(_value === null) {
                        self.usersSelect.clear();
                        self.usersSelect.lock();
                        self.usersSelect.addOption(_users);
                    } else {
                        var _usersOldSelectedOrganization = _.map(self.usersSelect.options, function(item) { return item.id }),
                            _usersSelectedOrganization = _.map(_users, function(item) { return item.id }),
                            _oldUsers = _.difference(_usersOldSelectedOrganization, _usersSelectedOrganization);

                        _.each(_oldUsers, function(userId) { self.usersSelect.removeOption(userId); });
                        self.usersSelect.addOption(_users);
                        self.usersSelect.unlock();
                    }
                });

                $('.js-modal-footer #modalSave').click(function(e) {
                    self.save();
                    self.instance.hide();
                    e.preventDefault();
                });

                $('.js-modal-footer #modalDelete').click(function(e) {
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

        _getValidOrganizations: function(selectedUserId) {
            var calendar = TimelyUi.calendar,
                options = calendar.options,
                selectedUser = calendar._getUserFromId(selectedUserId),
                commonOrganizations,
                validOrganizations;

            if (selectedUserId !== options.currentUser.id) {
                commonOrganizations = utils._commonOrganizations(options.currentUser.organizations, selectedUser.organizations);
                validOrganizations = _.filter(options.currentUserOrganizations, function(organization) {
                    return _.contains(commonOrganizations, organization.id)
                });
            } else {
                validOrganizations = options.currentUserOrganizations;
            }

            return validOrganizations;
        },

        _getUsers: function(organizationId) {
            var calendar = TimelyUi.calendar,
                options = calendar.options,
                _results = [],
                _usersSelectedOrganization = [];

            if(organizationId === null) {
                _results.push({ id: options.currentUser.id, username: options.currentUser.username });
            } else {
                _usersSelectedOrganization = utils._findById(options.currentUserOrganizations, organizationId).users;
                _.each(_usersSelectedOrganization, function(userId) { _results.push({ id: userId, username: calendar.getUsernameById(userId) }); });
            }

            return _results;
        },

        initUsers: function(organizationId) {
            var options = TimelyUi.calendar.options;

            self.ownerSelect.empty();
            self.ownerSelect.append('<option value="{0}">{1}</option>'.format(options.currentUser.id, options.currentUser.username));
            self.usersSelect.clear();
            self.usersSelect.addOption(self._getUsers(organizationId));

            return this;
        },

        initOrganizations: function(organizations) {
            self.organizationSelect.empty();
            self.organizationSelect.append('<option value="{0}">{1}</option>'.format('null', 'Private'));
            $.each(organizations, function(index, organization) {
                self.organizationSelect.append('<option value="{0}">{1}</option>'.format(organization.id, organization.name));
            });

            return this;
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
                options = calendar.options,
                chosenEvent = this.instance.options.calEvent,
				deleteButton = $('.modal-footer #modalDelete');

			// Disable/Enable delete button if chosen event is already persisted
			if (!!chosenEvent.id) {
				deleteButton.show();
			} else {
				deleteButton.hide();
			}

            self.eventDate = self.createEventDate('.modal-body #eventDate');
            self.startTime = self.createEventTime('.modal-body #startTime');
            self.endTime = self.createEventTime('.modal-body #endTime');

            // Load users and organizations dynamically
            var _validOrganizations = self._getValidOrganizations(chosenEvent.assignees);
            self.initUsers(chosenEvent.organization).initOrganizations(_validOrganizations);

            // Set correct organization value
            if ((_.contains(chosenEvent.assignees, options.currentUser.id)) && (chosenEvent.organization === null || typeof chosenEvent.id === 'undefined')) {
                self.usersSelect.lock();
                self.organizationSelect.val(String(null));
            } else {
                self.usersSelect.unlock();
                self.organizationSelect.val(chosenEvent.organization || utils._chooseDefaultOrganization(_validOrganizations).id);
            }

            // Set all others input with chosen event
			self.title.val(chosenEvent.title);
            self.ownerSelect.val(chosenEvent.owner || calendar.options.currentUser.id);
            self.usersSelect.setValue(chosenEvent.assignees);

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
                assignees: self.usersSelect.getValue(),
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