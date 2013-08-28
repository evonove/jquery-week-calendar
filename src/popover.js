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
		content: function() {
			return $('#popover-form').html();
		}
	};

	$.extend(self, {
		title: [],
		attachTo: function(element) {
			// Only one instance should be activated at the same time
			element.popover(this.options);
			self.instance = element.popover('show').data('popover');
			self.title = $('.popover #title');
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
            self.options.calEvent.organization = calendar.options.currentUser.id === self.options.calEvent.userId ? null : utils.chooseOrganization(calendar.options.currentUser.organizations, self.options.calEvent.user.organizations);
			self.options.calEvent.title = self.title.val();

            calendar.onSave(self.options.calEvent);
            self.hide();
			return this;
		},
		edit: function() {
			var calendar = TimelyUi.calendar;
			
			calendar.showModalForm(self.options.calEvent);
			return this;
		},
		initListeners: function() {
			/* Attach listener to popover buttons */
			$('.popover #popoverSave').on(events.down,function() {
				self.save();
			});

			$('.popover #popoverCancel').on(events.down, function() {
				self.clear();
			});

			$('.popover #popoverDetails').on(events.down,function() {
				self.edit().hide();
			});

			$('.popover #title').on(events.down,function() {
				self.title.focus();
			});
		}
	});
})(jQuery);