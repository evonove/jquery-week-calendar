(function($) {
	'use strict';

	/* Popover initial configuration */
	TimelyUi.popover = TimelyUi.popover || {};
	var self = TimelyUi.popover,
		calendar = TimelyUi.calendar;

	self.options = {
		html: true,
		placement: 'top',
		title: 'Create new event',
		content: function() {
			return $('#popover-form').html();
		}
	};

	$.extend(self, {
		attachTo: function(element) {
			// Only one instance should be activated at the same time
			element.popover(this.options);
			self.instance = element.popover('show').data('popover');
		},
		clear: function() {
			// Destroy enabled popover and cancel event creation
			self.instance.destroy();
			delete self.instance;
			delete self.options.calEvent;
			return self;
		},
		init: function() {
			// TODO: attach event listener
		}
	});
})(jQuery);