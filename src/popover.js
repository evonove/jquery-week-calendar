(function($) {
	'use strict';

	/* Popover initial configuration */
	TimelyUi.popover = TimelyUi.popover || {};
	var self = TimelyUi.popover,
		eventId = 1; // TODO: remove this because it should be known by AngularJS

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
			var calendar = TimelyUi.calendar;

			self.hide();
			calendar.removeLastUnsavedEvent();
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

			self.options.calEvent.id = eventId;
			self.options.calEvent.title = self.title.val();

			calendar.updateEvent(self.options.calEvent);
			eventId += 1; // TODO: remove this because it should be known by AngularJS
			return this;
		},
		edit: function() {
			var calendar = TimelyUi.calendar;
			
			calendar.options.showModalForm(self.options.calEvent);
			return this;
		},
		initListeners: function() {
			/* Attach listener to popover buttons */
			$('.popover #popoverSave').click(function() {
				self.save().clear();
			});

			$('.popover #popoverCancel').click(function() {
				self.clear();
			});

			$('.popover #popoverDetails').click(function() {
				self.edit().hide();
			});
		}
	});
})(jQuery);