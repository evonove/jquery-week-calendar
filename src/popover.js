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
		save: function() {
			var calendar = TimelyUi.calendar;

            if (calendar.getLastEventId !== null) {
			    self.options.calEvent.id = calendar.getLastEventId();
            }
            self.options.calEvent.owner = calendar.options.currentUser.id;

            // Check if this is a resource assignment or user assignment
            if (self.options.calEvent.assignees === undefined && self.options.calEvent.resources.length === 1) {
                self.options.calEvent.organization = utils.chooseOrganization(calendar.options.currentUser.organizations, utils._findById(calendar.options.loadedResources, _.first(self.options.calEvent.resources)).organizations);
            } else {
                self.options.calEvent.organization = calendar.options.currentUser.id === _.first(self.options.calEvent.assignees) ? TimelyUi.calendar.options.defaultOrganization : utils.chooseOrganization(calendar.options.currentUser.organizations, calendar._getUserFromId(_.first(self.options.calEvent.assignees)).organizations);
            }

			self.options.calEvent.title = self.title.val();

            calendar.onSave(self.options.calEvent);
            self.close();
			return self;
		},
		edit: function() {
			var calendar = TimelyUi.calendar;
			
			calendar.showModalForm(self.options.calEvent);
			return self;
		},
		close: function() {
			// Remove visible popover and delete instance
            $('.popover').remove();
			delete self.instance;
			delete self.options.calEvent;

			return self;
		},
		initListeners: function() {
			/* Attach listener to popover buttons */
			$('.js-popover-save').on(events.down, function() {
				self.save();
			});

			$('.js-popover-cancel').on(events.down, function() {
                TimelyUi.calendar.removeLastUnsavedEvent();
				self.close();
			});

			$('.js-popover-details').on(events.down, function() {
				self.edit().close();
			});
		}
	});
})(jQuery);