(function($) {
	'use strict';

	/* Popover initial configuration */
	TimelyUi.popover = TimelyUi.popover || {};
	var self = TimelyUi.popover,
		events = TimelyUi.compat.events,
        utils = TimelyUi.utils;

	self.options = {
		html: true,
		placement: 'top',
		title: 'Create new event',
		content: ''
	};

	$.extend(self, {
		attachTo: function(element) {
			// Only one instance should be activated at the same time
			element.popover(self.options);
			self.instance = element.popover('show').data('popover');
            self.title = $('.js-popover-title');
			self.title.focus();
			self.initListeners();
		},
		clear: function() {
			// Destroy enabled popover and cancel event creation
            TimelyUi.calendar.removeLastUnsavedEvent();
            self.hide();
			return self;
		},
		hide: function() {
			// Destroy visible popover without event delete
			self.instance.destroy();
			delete self.instance;
			delete self.options.calEvent;
			return self;
		},
		save: function() {
			var calendar = TimelyUi.calendar;

            if (calendar.getLastEventId !== null) {
			    self.options.calEvent.id = calendar.getLastEventId();
            }
            self.options.calEvent.owner = calendar.options.currentUser.id;
            self.options.calEvent.organization = calendar.options.currentUser.id === _.first(self.options.calEvent.assignees) ? null : utils.chooseOrganization(calendar.options.currentUser.organizations, calendar._getUserFromId(_.first(self.options.calEvent.assignees)).organizations);
			self.options.calEvent.title = self.title.val();

            calendar.onSave(self.options.calEvent);
            self.hide();
			return self;
		},
		edit: function() {
			var calendar = TimelyUi.calendar;
			
			calendar.showModalForm(self.options.calEvent);
			return self;
		},
		initListeners: function() {
			/* Attach listener to popover buttons */
			$('.js-popover-save').on(events.down, function() {
				self.save();
			});

			$('.js-popover-cancel').on(events.down, function() {
				self.clear();
			});

			$('.js-popover-details').on(events.down, function() {
				self.edit().hide();
			});
		}
	});
})(jQuery);