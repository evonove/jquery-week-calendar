/*
 * jQuery.weekCalendar v2.0-dev
 *
 * for support join us at the google group:
 *    - http://groups.google.com/group/jquery-week-calendar
 * have a look to the wiki for documentation:
 *    - http://wiki.github.com/themouette/jquery-week-calendar/
 * something went bad ? report an issue:
 *    - http://github.com/themouette/jquery-week-calendar/issues
 * get the last version on github:
 *    - http://github.com/themouette/jquery-week-calendar
 *
 * Copyright (c) 2009 Rob Monie
 * Copyright (c) 2010 Julien MUETTON
 * Dual licensed under the MIT and GPL licenses:
 *    http://www.opensource.org/licenses/mit-license.php
 *    http://www.gnu.org/licenses/gpl.html
 *
 * If you're after a monthly calendar plugin, check out this one :
 * http://arshaw.com/fullcalendar/
 */

(function($) {
  'use strict';
  
  $.widget('ui.weekCalendar', (function() {
    var _currentAjaxCall, _hourLineTimeout,
        utils = TimelyUi.utils;

    return {
      options: {
        lastEventId: 42,
        date: new Date(),
        timeFormat: 'HH:mm',
        dateFormat: 'dddd DD MMMM',
        alwaysDisplayTimeMinutes: true,
        daysToShow: 1,
        minBodyHeight: 300,
        firstDayOfWeek: function(calendar) {
          return $(calendar).weekCalendar('option', 'daysToShow') !== 5 ? 0 : 1;
        },
        timeSeparator: ' to ',
        startParam: 'start',
        endParam: 'end',
        businessHours: { start: 8, end: 18, limitDisplay: false },
        newEventText: '',
        timeslotHeight: 20,
        defaultEventLength: 2,
        timeslotsPerHour: 4,
        minDate: null,
        maxDate: null,
        data: [],
        unsavedEvents: [],
        showHeader: true,
        buttons: true,
        buttonText: {
          today: 'Today',
          lastWeek: 'Previous',
          nextWeek: 'Next'
        },
        switchDisplay: {},
        scrollToHourMillis: 0,
        allowEventDelete: false,
        allowCalEventOverlap: false,
        overlapEventsSeparate: false,
        totalEventsWidthPercentInOneColumn: 100,
        readonly: false,
        allowEventCreation: true,
        hourLine: true,
        modalTemplate: '/template/modal.html',
        popoverTemplate: '/template/popover.html',
        deletable: function(calEvent, element) {
          return true;
        },
        draggable: function(calEvent, element) {
          return true;
        },
        resizable: function(calEvent, element) {
          return true;
        },
        eventRender: function(calEvent, $event) {
          if (calEvent.end.getTime() < new Date().getTime()) {
            $event.css('backgroundColor', '#aaa');
            $event.find('.wc-time').css({
              backgroundColor: '#999',
              border:'1px solid #888'
            });
          }
        },
        eventAfterRender: function(calEvent, element) {
          return element;
        },
        eventRefresh: function(calEvent, element) {
          return element;
        },
        eventDrag: function(calEvent, element) {
            TimelyUi.utils.disableIScrolls();
        },
        eventDrop: function(calEvent, element) {
            var calendar = TimelyUi.calendar,
			    maxColumnNumber = TimelyUi.maxColumnNumber;

            TimelyUi.utils.enableIScroll(0);
            if (maxColumnNumber <= calendar.options.users.length){
                TimelyUi.utils.enableIScroll(1);
                TimelyUi.utils.enableIScroll(2);
            }

            // Persist new changes
            calendar.onSave(calEvent);
        },
        eventResize: function(calEvent, element) {
            TimelyUi.calendar.onSave(calEvent);
        },
        eventNew: function(calEvent, element, dayFreeBusyManager, calendar, upEvent) {
          TimelyUi.calendar.showPopoverForm(calEvent, element);
          var iscroll = TimelyUi.iScrollEls[1];
          TimelyUi.utils.lastPos = TimelyUi.utils._posByEl(iscroll,  element[0]);

          var iscroll0 = TimelyUi.iScrollEls[0];
          var pos = TimelyUi.utils._posByEl(iscroll0, element[0]);
          iscroll0.scrollTo(pos.left, pos.top+150, 0); //in old widget pos.left+40
          return true;
        },
        eventClick: function(calEvent, element, dayFreeBusyManager, calendar, clickEvent) {
          TimelyUi.calendar.showModalForm(calEvent);
          return true;
        },
        eventMouseover: function(calEvent, $event) {
        },
        eventMouseout: function(calEvent, $event) {
        },
        eventMousedownNewEvent: function(calEvent, $event) {
            TimelyUi.utils.disableIScrolls();
        },
        eventMouseupNewEvent: function(calEvent, $event) {
            var options = TimelyUi.calendar.options,
			    maxColumnNumber = TimelyUi.maxColumnNumber;

            TimelyUi.utils.enableIScroll(0);
            if (TimelyUi.maxColumnNumber <= options.users.length){
                TimelyUi.utils.enableIScroll(1);
                TimelyUi.utils.enableIScroll(2);
            }
        },
        eventDelete: function(calEvent, element, dayFreeBusyManager, calendar, clickEvent) {
        },
        calendarBeforeLoad: function(calendar) {
        },
        calendarAfterLoad: function(calendar) {
        },
        noEvents: function() {
        },
        eventHeader: function(calEvent, calendar) {
          var options = calendar.weekCalendar('option'),
              oneHour = 3600000,
              displayTitleWithTime = calEvent.end.getTime() - calEvent.start.getTime() <= (oneHour / options.timeslotsPerHour) ? true : false;

          if (displayTitleWithTime) {
            return utils.formatDate(calEvent.start, options.timeFormat) + ': ' + calEvent.title;
          } else {
            return utils.formatDate(calEvent.start, options.timeFormat) + options.timeSeparator + utils.formatDate(calEvent.end, options.timeFormat);
          }
        },
        eventBody: function(calEvent, calendar) {
          return calEvent.title;
        },

        /*** Users configuration ***/

        /* Defaults for quick insert */
        currentUser: {
          "id": 1,
          "username": "evonove",
          "defaultOrganization": null
        },

        /**
         * The available users for calendar.
         * if you want to display users separately, enable the
         * showAsSeparateUsers option.
         * if you provide a list of user and do not enable showAsSeparateUsers
         * option, then only the events that belongs to one or several of
         * given users will be displayed
         * @type {array}
         */
        users: [],
        /**
         * Should the calendar be displayed with separate column for each
         * users.
         * note that this option does nothing if you do not provide at least
         * one user.
         * @type {boolean}
         */
        showAsSeparateUsers: false,
        /**
         * Callback used to read user id from a user object.
         * @param {Object} user the user to retrieve the id from.
         * @param {number} index the user index from user list.
         * @param {jQuery} calendar the calendar object.
         * @return {int|String} the user id.
         */
        getUserId: function(user, index, calendar) {
          //return index;
          return user.id;
        },
        /**
         * Callback used to read user name from a user object.
         * @param {Object} user the user to retrieve the name from.
         * @param {number} index the user index from user list.
         * @param {jQuery} calendar the calendar object.
         * @return {String} the user name.
         */
        getUserName: function(user, index, calendar) {
          //return user;
          return user.username;
        },
        /**
         * Callback used to read organization name from a organization object.
         * @param {Object} organization the organization to retrieve the name from.
         * @param {number} index the user index from user list.
         * @param {jQuery} calendar the calendar object.
         * @return {String} the user name.
         */
        getOrganizationName: function(organization, index, calendar) {
          return organization.name;
        },
        /**
         * Reads the id(s) of user(s) for who the event should be displayed.
         * @param {Object} calEvent the calEvent to read informations from.
         * @param {jQuery} calendar the calendar object.
         * @return {number|String|Array} the user id(s) to appened events for.
         */
        getEventUserId: function(calEvent, calendar) {
          return calEvent.userId;
        },
        /**
         * Sets user id(s) to the calEvent
         * @param {Object} calEvent the calEvent to set informations to.
         * @param {jQuery} calendar the calendar object.
         * @return {Object} the calEvent with modified user id.
         */
        setEventUserId: function(userId, calEvent, calendar) {
          calEvent.userId = userId;
          return calEvent;
        },

        /*** FreeBusy options ***/

        /**
         * Should the calendar display freebusys ?
         * @type {boolean}
         */
        displayFreeBusys: false,
        /**
         * Read the id(s) for who the freebusy is available
         * @param {Object} calEvent the calEvent to read informations from.
         * @param {jQuery} calendar the calendar object.
         * @return {number|String|Array} the user id(s) to appened events for.
         */
        getFreeBusyUserId: function(calFreeBusy, calendar) {
          return calFreeBusy.userId;
        },
        /**
         * The default freeBusy object, used to manage default state
         * @type {Object}
         */
        defaultFreeBusy: {free: false},
        /**
         * Function used to display the freeBusy element
         * @type {Function}
         * @param {Object} freeBusy the freeBusy timeslot to render.
         * @param {jQuery} $freeBusy the freeBusy HTML element.
         * @param {jQuery} calendar the calendar element.
         */
        freeBusyRender: function(freeBusy, $freeBusy, calendar) {
          if (!freeBusy.free) {
            $freeBusy.addClass('free-busy-busy');
          }
          else {
            $freeBusy.addClass('free-busy-free');
          }
          return $freeBusy;
        },

        /*** Other options ***/

        /**
         * True means start on first day of week, false means starts on
         * startDate.
         * @param {jQuery} calendar the calendar object.
         * @type {Function|bool}
         */
        startOnFirstDayOfWeek: function(calendar) {
          return $(calendar).weekCalendar('option', 'daysToShow') >= 5;
        },
        /**
         * Should the columns be rendered alternatively using odd/even
         * class
         * @type {boolean}
         */
        displayOddEven: false,
        textSize: 13,
        /**
         * the title attribute for the calendar. possible placeholders are:
         * <ul>
         *  <li>%start%</li>
         *  <li>%end%</li>
         *  <li>%date%</li>
         * </ul>
         * @type {Function|string}
         * @param {number} option daysToShow.
         * @return {String} the title attribute for the calendar.
         */
        title: '%start% - %end%',
        /**
         * default options to pass to callback
         * you can pass a function returning an object or a litteral object
         * @type {object|function(#calendar)}
         */
        jsonOptions: {},
        headerSeparator: ' ',
        /**
          * returns formatted header for day display
          * @type {function(date,calendar)}
          */
        getHeaderDate: null,
        preventDragOnEventCreation: false,
        /**
          * the event on which to bind calendar resize
          * @type {string}
          */
        resizeEvent: 'weekcalendar.resize'
      },

      /***************************
       * Calendar initialization *
       ***************************/
      _create: function() {
        var self = this;
        self._computeOptions();
        self._setupEventDelegation();
        self._addClassesWidget();
        self._loadModalForm();
        self._loadPopoverForm();
        self._renderCalendar();
        self._loadCalEvents();
        self._resizeCalendar();
        //self._scrollToHour(self.options.date.getHours(), true);

        if (this.options.resizeEvent) {
          $(window).unbind(this.options.resizeEvent);
          $(window).bind(this.options.resizeEvent, function() {
            self._resizeCalendar();
          });
        }

        // http://stackoverflow.com/questions/13244667/window-resize-event-fires-twice-in-jquery
        window.onresize = function(e){
            if(e.originalEvent === undefined && e.timeStamp - TimelyUi.calendar.lastRefresh > 500){
                var withRedim = TimelyUi.calendar.lastWidth !== window.innerWidth;
                TimelyUi.calendar.lastWidth = window.innerWidth;
                // need to avoid a second pass, but commentated because without the second pass widghet sliding stop working
                // TimelyUi.calendar.lastRefresh = new Date().getTime();
                TimelyUi.utils._resetIScrolls(withRedim, true);
                return false;
            }
        };
      },

      /********************
       * Public functions *
       ********************/
      /*
       * Refresh the events for the currently displayed week.
       */
      refresh: function(onlyPersistedItem) {
        this._loadCalEvents(this.element.data('startDate'), onlyPersistedItem);
      },

      /*
       * Clear all events currently loaded into the calendar
       */
      clear: function() {
        this._clearCalendar();
      },

      /*
       * Go to this week
       */
      today: function() {
        this._clearCalendar();
        this._loadCalEvents(new Date());
      },

      /*
       * Go to the previous week relative to the currently displayed week
       */
      prevWeek: function() {
        // Minus more than 1 day to be sure we're in previous week - account for daylight savings or other anomolies
        var newDate = new Date(this.element.data('startDate').getTime() - (MILLIS_IN_WEEK / 6));
        this._clearCalendar();
        this._loadCalEvents(newDate);
      },

      /*
       * Go to the next week relative to the currently displayed week
       */
      nextWeek: function() {
        //add 8 days to be sure of being in prev week - allows for daylight savings or other anomolies
        var newDate = new Date(this.element.data('startDate').getTime() + MILLIS_IN_WEEK + MILLIS_IN_DAY);
        this._clearCalendar();
        this._loadCalEvents(newDate);
      },

      /*
       * Reload the calendar to whatever week the date passed in falls on.
       */
      gotoWeek: function(date) {
        this._clearCalendar();
        this._loadCalEvents(date);
      },

      /*
       * Reload the calendar to whatever week the date passed in falls on.
       */
      gotoDate: function(date) {
        this._clearCalendar();
        this._loadCalEvents(date);
      },

      /*
       * Change the number of days to show
       */
      setDaysToShow: function(daysToShow) {
        var self = this;
        var hour = self._getCurrentScrollHour();
        self.options.daysToShow = daysToShow;
        $(self.element).html('');
        self._renderCalendar();
        self._loadCalEvents();
        self._resizeCalendar();
        self._scrollToHour(hour, false);

        if (this.options.resizeEvent) {
          $(window).unbind(this.options.resizeEvent);
          $(window).bind(this.options.resizeEvent, function() {
            self._resizeCalendar();
          });
        }
      },

      /*
       * Create a popover attached to an element
       */
      showPopoverForm: function(calEvent, element) {
        var calendar = TimelyUi.calendar,
            popover = TimelyUi.popover;

        // Remove existing popover and last unsaved event
        if (typeof popover.instance !== 'undefined') {
          popover.clear();
          calendar.removeLastUnsavedEvent();
        }

        calendar.options.unsavedEvents.push(element);

        popover.options.calEvent = calEvent;
        popover.attachTo(element);
      },

      /*
       * Scale bootstrap modal form
       * http://stackoverflow.com/questions/14009178/correct-way-to-increase-bootstrap-modals-height
       */
      _scaleModal: function($element) {
        var size = { width: $(window).width(), height: $(window).height() },
            offset = 20,
            offsetBody = 150;

        $element.css('height', size.height - offset);
        $('.modal-body').css('height', size.height - (offset + offsetBody + 50));
        $element.css('top', 0);
      },

      /*
       * Show modal form to create/edit event details
       */
      showModalForm: function(calEvent) {
        var self = this,
            modal = TimelyUi.modal,
            isMobile = TimelyUi.compat.isMobile;

        modal.init($('#ajax-modal'), self.options.users, self.options.organizations);
        modal.instance.options.calEvent = calEvent;
        modal.instance.$element.modal('show');

        if(isMobile){
          self._scaleModal(modal.instance.$element);
        }
      },

      /*** Persistence provider ***/
      getLastEventId: function() { return this.options.lastEventId },
      onSave: function(calEvent) {
          if (!calEvent.id) {
              var data = this.options.data;
              this.options.lastEventId += 1;
              data.push(calEvent);
          }
          this.updateEvent(calEvent);
      },
      onDelete: function(calEventToRemove) {
          var data = this.options.data;

          data.splice($.inArray(calEventToRemove, data), 1);
          this.removeEvent(calEventToRemove.id);
      },

      /*
       * Remove an event based on it's id
       */
      removeEvent: function(eventId) {
        var self = this;

        self.element.find('.wc-cal-event').each(function() {
          if ($(this).data('calEvent').id === eventId) {
            $(this).remove();
            return false;
          }
        });

        // This could be more efficient rather than running on all days regardless...
        self.element.find('.wc-day-column-inner').each(function() {
          self._adjustOverlappingEvents($(this));
        });
      },

      /*
       * Removes any events that have been added but not yet saved (have no id).
       * This is useful to call after adding a freshly saved new event.
       */
      removeUnsavedEvents: function() {
        var self = this;

        self.element.find('.wc-new-cal-event').each(function() {
          $(this).remove();
        });

        // This could be more efficient rather than running on all days regardless...
        self.element.find('.wc-day-column-inner').each(function() {
          self._adjustOverlappingEvents($(this));
        });
      },

      /*
       * Removes last inserted event that doesn't have any id
       * This is useful to remove the event during quick insert mode with popover.
       */
      removeLastUnsavedEvent: function() {
        var self = this,
            lastUnsavedEvent = self.options.unsavedEvents.shift();

        if (typeof lastUnsavedEvent !== 'undefined') {
          lastUnsavedEvent.remove();
        }
      },

      /*
       * Update an event in the calendar. If the event exists it refreshes
       * it's rendering. If it's a new event that does not exist in the calendar
       * it will be added.
       */
      updateEvent: function(calEvent) {
        this._updateEventInCalendar(calEvent);
      },

      /*
       * Returns an array of timeslot start and end times based on
       * the configured grid of the calendar. Returns in both date and
       * formatted time based on the 'timeFormat' config option.
       */
      getTimeslotTimes: function(date) {
        var options = this.options;
        var firstHourDisplayed = options.businessHours.limitDisplay ? options.businessHours.start : 0;
        var startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), firstHourDisplayed);
        var times = [], startMillis = startDate.getTime();

        for (var i = 0; i < options.timeslotsPerDay; i++) {
          var endMillis = startMillis + options.millisPerTimeslot;
          times[i] = {
            start: new Date(startMillis),
            startFormatted: utils.formatDate(new Date(startMillis), this.timeFormat),
            end: new Date(endMillis),
            endFormatted: utils.formatDate(new Date(startMillis), this.timeFormat)
          };
          startMillis = endMillis;
        }
        return times;
      },

      serializeEvents: function() {
        var self = this;
        var calEvents = [];

        self.element.find('.wc-cal-event').each(function() {
          calEvents.push($(this).data('calEvent'));
        });
        return calEvents;
      },

      next: function() {
        if (this._startOnFirstDayOfWeek()) {
          return this.nextWeek();
        }
        var newDate = new Date(this.element.data('startDate').getTime());
        newDate.setDate(newDate.getDate() + this.options.daysToShow);

        this._clearCalendar();
        this._loadCalEvents(newDate);
      },

      prev: function() {
        if (!this._startOnFirstDayOfWeek()) {
          var newDate = new Date(this.element.data('startDate').getTime());
          newDate.setDate(newDate.getDate() - this.options.daysToShow);

          this._clearCalendar();
          this._loadCalEvents(newDate);
        } else {
          return this.prevWeek();
        }
      },

      getCurrentFirstDay: function() {
        return this._dateFirstDayOfWeek(this.options.date || new Date());
      },

      getCurrentLastDay: function() {
        return this._addDays(this.getCurrentFirstDay(), this.options.daysToShow - 1);
      },

      /**********************
        * Private functions *
        *********************/

      _setOption: function(key, value) {
        var self = this;
        if (self.options[key] !== value) {
          // Event callback change, no need to re-render the events
          if (key === 'beforeEventNew') {
            self.options[key] = value;
            return;
          }

          /* This could be made more efficient at some stage by caching the
           * events array locally in a store but this should be done in conjunction
           * with a proper binding model.
           */

          var currentEvents = self.element.find('.wc-cal-event').map(function() {
            return $(this).data('calEvent');
          });

          var newOptions = {};
          newOptions[key] = value;
          self._renderEvents({events: currentEvents, options: newOptions}, self.element.find('.wc-day-column-inner'));
        }
      },

      /* Compute dynamic options based on other config values */
      _computeOptions: function() {
        var options = this.options;
        if (options.businessHours.limitDisplay) {
          options.timeslotsPerDay = options.timeslotsPerHour * (options.businessHours.end - options.businessHours.start);
          options.millisToDisplay = (options.businessHours.end - options.businessHours.start) * 3600000;
          options.millisPerTimeslot = options.millisToDisplay / options.timeslotsPerDay;
        } else {
          options.timeslotsPerDay = options.timeslotsPerHour * 24;
          options.millisToDisplay = MILLIS_IN_DAY;
          options.millisPerTimeslot = MILLIS_IN_DAY / options.timeslotsPerDay;
        }
      },

      /*
       * TODO: remove this useless function
       * Resize the calendar scrollable height based on the provided function in options.
       */
      _resizeCalendar: function() {
        var options = this.options;
        if (options && $.isFunction(options.height)) {
        }
      },

      /*
       * TODO: remove this useless function
       */
      _findScrollBarWidth: function() {
      },

      /*
       * Configure calendar interaction events that are able to use event
       * delegation for greater efficiency
       * TODO: in mobile enviroment there are not mouseover or mouse out...
       */
      _setupEventDelegation: function() {
        //console.log('_setupEventDelegation');
        var self = this;
        var options = this.options;
        var events = TimelyUi.compat.events;
        var on = TimelyUi.compat.on;
        var off = TimelyUi.compat.off;

        var clickEvent = function(event) {
          var $target = $(event.target);
          var freeBusyManager;

          // Click is disabled
          if ($target.data('preventClick')) {
            return;
          }

          var $calEvent = $target.hasClass('wc-cal-event') ?
            $target :
            $target.parents('.wc-cal-event');
          if (!$calEvent.length || !$calEvent.data('calEvent')) {
            return;
          }

          freeBusyManager = self.getFreeBusyManagerForEvent($calEvent.data('calEvent'));

          if (options.allowEventDelete && $target.hasClass('wc-cal-event-delete')) {
            options.eventDelete($calEvent.data('calEvent'), $calEvent, freeBusyManager, self.element, event);
          } else {
            options.eventClick($calEvent.data('calEvent'), $calEvent, freeBusyManager, self.element, event);
          }
        };
        var mouseoverEvent = function(event) {
          var $target = $(event.target);
          var $calEvent = $target.hasClass('wc-cal-event') ?
            $target :
            $target.parents('.wc-cal-event');

          if (!$calEvent.length || !$calEvent.data('calEvent')) {
            return;
          }

          if (self._isDraggingOrResizing($calEvent)) {
            return;
          }

          options.eventMouseover($calEvent.data('calEvent'), $calEvent, event);
        };
        var mouseoutEvent = function(event) {
          var $target = $(event.target);
          var $calEvent = $target.hasClass('wc-cal-event') ?
            $target :
            $target.parents('.wc-cal-event');

          if (!$calEvent.length || !$calEvent.data('calEvent')) {
            return;
          }

          if (self._isDraggingOrResizing($calEvent)) {
            return;
          }

          options.eventMouseout($calEvent.data('calEvent'), $calEvent, event);
        };
        var $element = $(this.element);
        on($element, events.click, clickEvent);
        on($element, events.over, mouseoverEvent);
        on($element, events.out, mouseoutEvent);
      },

      /*
       * Check if a ui draggable or resizable is currently being dragged or resized
       */
      _isDraggingOrResizing: function($target) {
        return $target.hasClass('ui-draggable-dragging') ||
               $target.hasClass('ui-resizable-resizing');
      },

      /*
       * Set global classes to calendar widget
       */
      _addClassesWidget: function() {
        var $calendarContainer = this.element;
        $calendarContainer
          .addClass('row-fluid')
          .addClass('fill')
          .addClass('wc-calendar');
      },

      /*
       * Append modal form to calendar div loading dynamically all contents
       */
      _loadModalForm: function() {
        var calendarContainer = this.element;

        calendarContainer.append('<div id="ajax-modal" class="modal modal-event hide fade"/>');
        $('#ajax-modal').load(this.options.modalTemplate);
      },

      /*
       * Append popover form to calendar div loading dynamically all contents
       */
      _loadPopoverForm: function() {
        var calendarContainer = this.element;

        calendarContainer.append('<div id="popover-form" class="hide"/>');
        $('#popover-form').load(this.options.popoverTemplate);
      },

      /*
       * Render the main calendar layout
       */
      _renderCalendar: function() {
        var $calendarContainer, $weekDayColumns;
        var self = this;
        var options = this.options;

        $calendarContainer = self.element;

        // Render the different parts of calendar
        self._renderCalendarButtons($calendarContainer);
        self._renderCalendarHeader($calendarContainer);
        self._renderCalendarBody($calendarContainer);

        $weekDayColumns = $calendarContainer.find('.wc-day-column-inner');
        $weekDayColumns.each(function(i, val) {
          if (!options.readonly) {
            self._addDroppableToWeekDay($(this));
            if (options.allowEventCreation) {
              self._setupEventCreationForWeekDay($(this));
            }
          }
        });
      },

      /*
       * Render the nav buttons on top of the calendar
       */
      _renderCalendarButtons: function($calendarContainer) {
        var self = this, options = this.options,
          calendarNavHtml = '',
          $calendarNavContainer,
          $container;

        if (options.showHeader) {
          if (options.buttons) {

            // Rendering header without switchDisplay
            calendarNavHtml += '<div id="first-row" class="row-fluid calendar-buttons">';
            calendarNavHtml += '<div class="wc-nav span12">';
            calendarNavHtml += '<button class="btn btn-inverse wc-today"><i class="icon-home"></i> ' + options.buttonText.today + '</button> ';
            calendarNavHtml += '<div class="btn-group">';
            calendarNavHtml += '<button class="btn btn-inverse wc-prev"><i class="icon-chevron-left"></i></button>';
            calendarNavHtml += '<button class="btn btn-inverse wc-next"><i class="icon-chevron-right"></i></button>';
            calendarNavHtml += '</div>';
            calendarNavHtml += '<div class="wc-display btn-group pull-right" data-toggle="buttons-radio"></div>';
            calendarNavHtml += '</div>';
            calendarNavHtml += '</div>';
            $(calendarNavHtml).appendTo($calendarContainer);

            // Rendering users filter if they are more than 1
            if (options.users && options.users.length > 1) {
              var userNavHtml = '';
              $calendarNavContainer = $calendarContainer.find('.wc-nav');

              userNavHtml += '<div class="btn-group pull-right">';
              userNavHtml += '<a class="btn btn-inverse dropdown-toggle" data-toggle="dropdown" href="#">';
              userNavHtml += 'Users ';
              userNavHtml += '<span class="caret"></span>';
              userNavHtml += '</a>';
              userNavHtml += '<ul id="dropdown-user" class="dropdown-menu">';
              userNavHtml += '</ul>';
              userNavHtml += '</div>';
              $(userNavHtml).appendTo($calendarNavContainer);

              $container = $calendarContainer.find('#dropdown-user');
              $.each(options.users, function(index, user) {
                var _input = $('<li><a tabindex="-1" href="#"><button type="button" class="btn active" data-toggle="button" data-propagation="false" data-user-id="'+user.id+'">' + options.getUserName(user) + '</button></a></li>');
                $container.append(_input);
              });
              $container.find('[data-propagation=\"false\"]').click(function(event) {
                utils.toggleUserByButton(event, $(this));
                return false;
              });
            }

            // Rendering organizations filter if they are more than 1 and have extended profile
            if (options.organizations && options.organizations.length > 1) {
              var orgNavHtml = '';
              
              orgNavHtml += '<div class="btn-group pull-right">';
              orgNavHtml += '<a class="btn btn-inverse dropdown-toggle" data-toggle="dropdown" href="#">';
              orgNavHtml += 'Teams ';
              orgNavHtml += '<span class="caret"></span>';
              orgNavHtml += '</a>';
              orgNavHtml += '<ul id="dropdown-organization" class="dropdown-menu">';
              orgNavHtml += '</ul>';
              orgNavHtml += '</div>';
              $(orgNavHtml).appendTo($calendarNavContainer);

              $container = $calendarContainer.find('#dropdown-organization');
              $.each(options.organizations, function(index, organization) {
                var _input = $('<li><a tabindex="-1" href="#"><button type="button" class="btn" data-organization-id="'+organization.id+'">' + options.getOrganizationName(organization) + '</button></a></li>');
                $container.append(_input);
              });
              $container.find('button').click(function(event) {
                var organizationId = $(this).data('organization-id');
                utils.showUsers(organizationId);
              });
            }

            // Add listener to buttons
            $calendarContainer.find('.wc-today').click(function() {
              self.today();
              return false;
            });

            $calendarContainer.find('.wc-prev').click(function() {
              self.element.weekCalendar('prev');
              return false;
            });

            $calendarContainer.find('.wc-next').click(function() {
              self.element.weekCalendar('next');
              return false;
            });

            // Add buttons to switch display
            if (this.options.switchDisplay && $.isPlainObject(this.options.switchDisplay)) {
              $container = $calendarContainer.find('.wc-display');
              $.each(this.options.switchDisplay, function(label, option) {
                var _input = $('<button class="btn">' + label + '</button>');
                _input.val(option);
                if (parseInt(self.options.daysToShow, 10) === parseInt(option, 10)) {
                  _input.attr('checked', 'checked');
                }

                $container.append(_input);
              });
              $container.find('button').click(function() {
                self.setDaysToShow(parseInt($(this).val(), 10));
              });
            }
          } else {
            calendarNavHtml = '';
            calendarNavHtml += '<div class=\"wc-toolbar\">';
            calendarNavHtml += '<h1 class=\"wc-title\"></h1>';
            calendarNavHtml += '</div>';
            $(calendarNavHtml).appendTo($calendarContainer);
          }
        } else {
          return;
        }
      },

      /*
       * Render the calendar header, including date and user header
       */
      _renderCalendarHeader: function($calendarContainer) {
        var self = this;
        var options = this.options;
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        var calendarHeaderHtml;
        var rowspan = '', colspan = '';

        if (showAsSeparatedUser) {
          rowspan = ' rowspan=\"2\"';
          colspan = ' colspan=\"' + options.users.length + '\" ';
        }

        // Header containers
        calendarHeaderHtml = '<div class=\"row-fluid calendar-header\">';
        calendarHeaderHtml += '<div class=\"wc-header span12\">';
        
        // Days row
        calendarHeaderHtml += '<table ><thead><tr><th class=\"wc-time-column-header\"></th>';
        for (var i = 1; i <= options.daysToShow; i++) {
          calendarHeaderHtml += '<th class=\"wc-day-column-header wc-day-' + i + '\"'+colspan+'></th>';
        }
        calendarHeaderHtml += '</thead></table>';

        // Users row
        if (showAsSeparatedUser) {
          calendarHeaderHtml += '<table id="calendar-header-wrapper" class="wrapper wc-calendar-header-wrapper"><thead class="wc-scroller-width">';
          calendarHeaderHtml += '<tr><th class=\"wc-time-column-header\"></th>';
          var uLength = options.users.length, _headerClass = '';

          for (i = 1; i <= options.daysToShow; i++) {
            for (var j = 0; j < uLength; j++) {
              _headerClass = [];
              if (j === 0) {
                _headerClass.push('wc-day-column-first');
              }
              if (j === uLength - 1) {
                _headerClass.push('wc-day-column-last');
              }
              if (!_headerClass.length) {
                _headerClass = 'wc-day-column-middle';
              }
              else {
                _headerClass = _headerClass.join(' ');
              }
              calendarHeaderHtml += '<th class=\"' + _headerClass + ' wc-user-header wc-day-' + i + ' wc-user-' + self._getUserIdFromIndex(j) + '\">';
              calendarHeaderHtml += self._getUserName(j);
              calendarHeaderHtml += '</th>';
            }
          }
          calendarHeaderHtml += '</tr>';
        }
        calendarHeaderHtml += '</thead></table>';
        calendarHeaderHtml += '<div class=\"wc-go-left\"><button type="button" class="btn btn-large btn-inverse"><i class="icon-chevron-left"></i></button></div>';
        calendarHeaderHtml += '<div class=\"wc-go-right\"><button type="button" class="btn btn-large btn-inverse"><i class="icon-chevron-right"></i></button></div>';
        calendarHeaderHtml += '</div></div>';

        $(calendarHeaderHtml).appendTo($calendarContainer);
      },

      /*
       * Render the calendar body.
       * Calendar body is composed of several distinct parts.
       * Each part is displayed in a separated row to ease rendering.
       */
      _renderCalendarBody: function($calendarContainer) {
        var self = this;
        var options = this.options;
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        var $calendarBody, $calendarTableTbody;

        // Create the structure
        $calendarBody = '';
        
        $calendarBody += '<div id="scrollbar-wrapper" class=\"row-fluid wc-scrollbar-wrapper\">';
        $calendarBody += '  <div class=\"wc-scroller-height\">';

        $calendarBody += '    <div id="calendar-body-wrapper" class=\"wc-scrollable-grid wc-calendar-body-wrapper\">';
        $calendarBody += '      <div class=\"wc-scroller-width\">';
        
        $calendarBody += '        <table class=\"wc-time-slots\" >';
        $calendarBody += '          <tbody>';
        $calendarBody += '          </tbody>';
        $calendarBody += '      </table>';
        
        $calendarBody += '    </div>';
        $calendarBody += '    <div id="day-hours" class="wc-day-hours">'+self._renderDayHours()+'</div>';
        $calendarBody += '    </div>';

        $calendarBody += '  </div>';
        $calendarBody += '</div>';
        $calendarBody = $($calendarBody);
        $calendarTableTbody = $calendarBody.find('tbody');

        self._renderCalendarBodyTimeSlots($calendarTableTbody);
        self._renderCalendarBodyOddEven($calendarTableTbody);
        self._renderCalendarBodyFreeBusy($calendarTableTbody);
        self._renderCalendarBodyEvents($calendarTableTbody);

        $calendarBody.appendTo($calendarContainer);

        // Set the column height
        $calendarContainer.find('.wc-full-height-column').height(options.timeslotHeight * options.timeslotsPerDay);

        // Set the timeslot height
        $calendarContainer.find('.wc-time-slot').height(options.timeslotHeight - 1); //account for border

        /* Init the time row header height */

        /* TODO
         * if total height for an hour is less than 11px, there is a display problem.
         * Find a way to handle it
         */
        $calendarContainer.find('.wc-time-header-cell').css({
          height: (options.timeslotHeight * options.timeslotsPerHour) - 11,
          padding: 5
        });

        // Add the user data to every impacted column
        if (showAsSeparatedUser) {
          for (var i = 0, uLength = options.users.length; i < uLength; i++) {
            $calendarContainer.find('.wc-user-' + self._getUserIdFromIndex(i))
              .data('wcUser', options.getUserName(options.users[i]))
              .data('wcUserIndex', i)
              .data('wcUserId', self._getUserIdFromIndex(i));
          }
        }
      },

      /*
       * Render the timeslots separation
       */
      _renderCalendarBodyTimeSlots: function($calendarTableTbody) {
        var options = this.options;
        var renderRow, i, j;
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        var start = (options.businessHours.limitDisplay ? options.businessHours.start : 0);
        var end = (options.businessHours.limitDisplay ? options.businessHours.end : 24);
        var rowspan = 1;

        // Calculate the rowspan
        if (options.displayOddEven) {
          rowspan += 1;
        }

        if (options.displayFreeBusys) {
          rowspan += 1;
        }

        if (rowspan > 1) {
          rowspan = ' rowspan=\"' + rowspan + '\"';
        } else {
          rowspan = '';
        }

        renderRow = '<tr class=\"wc-grid-row-timeslot\">';
        renderRow += '<td class=\"wc-grid-timeslot-header\"' + rowspan + '></td>';
        renderRow += '<td class=\"wc-timeslot-placeholder\" colspan=\"' + options.users.length + '\">';
        renderRow += '<div class=\"wc-no-height-wrapper wc-time-slot-wrapper\">';
        renderRow += '<div class=\"wc-time-slots\">';

        for (i = start; i < end; i++) {
          for (j = 0; j < options.timeslotsPerHour - 1; j++) {
            renderRow += '<div class=\"wc-time-slot\"></div>';
          }
          renderRow += '<div class=\"wc-time-slot wc-hour-end\"></div>';
        }

        renderRow += '</div>';
        renderRow += '</div>';
        renderRow += '</td>';
        renderRow += '</tr>';

        $(renderRow).appendTo($calendarTableTbody);
      },

      /*
       * Render the odd even columns
       */
      _renderCalendarBodyOddEven: function($calendarTableTbody) {
        if (this.options.displayOddEven) {
          var self = this,
            options = self.options,
            renderRow = '<tr class=\"wc-grid-row-oddeven\">',
            showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length,
            oddEvenClasses = {'odd': 'wc-column-odd', 'even': 'wc-column-even'},
            oddEven;

          // Now let's display oddEven placeholders
          for (var i = 1; i <= options.daysToShow; i++) {
            if (!showAsSeparatedUser) {
              oddEven = (oddEven === 'odd' ? 'even' : 'odd');
              renderRow += '<td class=\"wc-day-column day-' + i + '\">';
              renderRow += '<div class=\"wc-no-height-wrapper wc-oddeven-wrapper\">';
              renderRow += '<div class=\"wc-full-height-column ' + oddEvenClasses[oddEven] + '\"></div>';
              renderRow += '</div>';
              renderRow += '</td>';
            } else {
              var uLength = options.users.length;
              for (var j = 0; j < uLength; j++) {
                oddEven = (oddEven === 'odd' ? 'even' : 'odd');
                renderRow += '<td class=\"wc-day-column day-' + i + ' wc-user-' + self._getUserIdFromIndex(j)  + '\">';
                renderRow += '<div class=\"wc-no-height-wrapper wc-oddeven-wrapper\">';
                renderRow += '<div class=\"wc-full-height-column ' + oddEvenClasses[oddEven] + '\" ></div>';
                renderRow += '</div>';
                renderRow += '</td>';
              }
            }
          }
          renderRow += '</tr>';

          $(renderRow).appendTo($calendarTableTbody);
        }
      },

      /*
       * Render the freebusy placeholders
       */
      _renderCalendarBodyFreeBusy: function($calendarTableTbody) {
        if (this.options.displayFreeBusys) {
          var self = this;
          var options = this.options;
          var renderRow = '<tr class=\"wc-grid-row-freebusy\">';
          var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;

          renderRow += '</td>';

          // Now let's display freebusy placeholders
          for (var i = 1; i <= options.daysToShow; i++) {
            if (options.displayFreeBusys) {
              if (!showAsSeparatedUser) {
                renderRow += '<td class=\"wc-day-column day-' + i + '\">';
                renderRow += '<div class=\"wc-no-height-wrapper wc-freebusy-wrapper\">';
                renderRow += '<div class=\"wc-full-height-column wc-column-freebusy wc-day-' + i + '\"></div>';
                renderRow += '</div>';
                renderRow += '</td>';
              } else {
                var uLength = options.users.length;
                for (var j = 0; j < uLength; j++) {
                  renderRow += '<td class=\"wc-day-column day-' + i + ' wc-user-' + self._getUserIdFromIndex(j) + '\">';
                  renderRow += '<div class=\"wc-no-height-wrapper wc-freebusy-wrapper\">';
                  renderRow += '<div class=\"wc-full-height-column wc-column-freebusy wc-day-' + i;
                  renderRow += ' wc-user-' + self._getUserIdFromIndex(j) + '\">';
                  renderRow += '</div>';
                  renderRow += '</div>';
                  renderRow += '</td>';
                }
              }
            }
          }

          renderRow += '</tr>';
          $(renderRow).appendTo($calendarTableTbody);
        }
      },


      _renderDayHours: function() {
        
        var self = this;
        var options = this.options;
        var start = (options.businessHours.limitDisplay ? options.businessHours.start : 0);
        var end = (options.businessHours.limitDisplay ? options.businessHours.end : 24);
        var renderRow;

        renderRow = '<div class=\"td-wrapper\">';

        for (var i = start; i < end; i++) {
          var bhClass = (options.businessHours.start <= i && options.businessHours.end > i) ? 'state-active wc-business-hours' : '';
          renderRow += '<div class=\"wc-hour-header ' + bhClass + '\">';
          renderRow += '<div class=\"wc-time-header-cell\">' + self._24HourForIndex(i) + '</div>';
          renderRow += '</div>';
        }
        renderRow += '</div>';
        return renderRow;
      },
      /*
       * Render the calendar body for event placeholders
       */
      _renderCalendarBodyEvents: function($calendarTableTbody) {
        //console.log('_renderCalendarBodyEvents');

        var self = this;
        var options = this.options;
        var renderRow;
        var start = (options.businessHours.limitDisplay ? options.businessHours.start : 0);
        var end = (options.businessHours.limitDisplay ? options.businessHours.end : 24);
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        

        renderRow = '<tr class=\"wc-grid-row-events\">';
        renderRow += '<td class=\"wc-grid-timeslot-header\">';
        renderRow += self._renderDayHours();
        renderRow += '</td>';

        // Now let's display events placeholders
        var _columnBaseClass = 'ui-state-default wc-day-column';
        for (var i = 1; i <= options.daysToShow; i++) {
          if (!showAsSeparatedUser) {
            renderRow += '<td class=\"' + _columnBaseClass + ' wc-day-column-first wc-day-column-last day-' + i + '\">';
            renderRow += '<div class=\"wc-full-height-column wc-day-column-inner day-' + i + '\"></div>';
            renderRow += '</div>';
            renderRow += '</td>';
          } else {
            var uLength = options.users.length;
            var columnclass;
            for (var j = 0; j < uLength; j++) {
              columnclass = [];
              if (j === 0) {
                columnclass.push('wc-day-column-first wc-user-' + self._getUserIdFromIndex(j));
              }
              if (j === uLength - 1) {
                columnclass.push('wc-day-column-last wc-user-' + self._getUserIdFromIndex(j));
              }
              if (!columnclass.length) {
                columnclass = 'wc-day-column-middle wc-user-' + self._getUserIdFromIndex(j);
              }
              else {
                columnclass = columnclass.join(' ');
              }
              renderRow += '<td class=\"' + _columnBaseClass + ' ' + columnclass + ' day-' + i + '\">';
              renderRow += '<div class=\"wc-full-height-column wc-day-column-inner day-' + i;
              renderRow += ' wc-user-' + self._getUserIdFromIndex(j) + '\">';
              renderRow += '</div>';
              renderRow += '</div>';
              renderRow += '</td>';
            }
          }
        }

        renderRow += '</tr>';

        $(renderRow).appendTo($calendarTableTbody);
      },

      /*
       * Setup events for capturing new events
       */
      _setupEventCreationForWeekDay: function($weekDay) {
      
        var events = TimelyUi.compat.events,
            utils = TimelyUi.utils,
            on = TimelyUi.compat.on,
            off = TimelyUi.compat.off,
            self = this,
            options = this.options;

        self.lastValidTagert = {};
        console.log('_setupEventCreationForWeekDay');
        self.upEventCreation = function(event) {
          console.log('upEventCreation');

          off($('html'), events.up, self.upEventCreation);

          var $target = self.lastValidTagert;
          if ($target.closest) {
            var $weekDay = $target.closest('.wc-day-column-inner');
            var $newEvent = $weekDay.find('.wc-new-cal-event-creating');

            //i don't know its utility
            // console.log('removed downEventCreation on');
            // console.log($weekDay);
            //off($weekDay, events.down, self.downEventCreation);
            
            if ($newEvent.length) {
              var createdFromSingleClick = !$newEvent.hasClass('ui-resizable-resizing');

              // If even created from a single click only, default height
              if (createdFromSingleClick) {
                $newEvent.css({height: options.timeslotHeight * options.defaultEventLength}).show();
              }
              var top = parseInt($newEvent.css('top'), 10);
              var eventDuration = self._getEventDurationFromPositionedEventElement($weekDay, $newEvent, top);

              
              var newCalEvent = {start: eventDuration.start, end: eventDuration.end, title: options.newEventText};
              var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;

              if (showAsSeparatedUser) {
                newCalEvent = self._setEventUserId(newCalEvent, $weekDay.data('wcUserId'));
              }
              else if (!options.showAsSeparateUsers && options.users && options.users.length === 1) {
                newCalEvent = self._setEventUserId(newCalEvent, self._getUserIdFromIndex(0));
              }

              var freeBusyManager = self.getFreeBusyManagerForEvent(newCalEvent);
              var $renderedCalEvent = self._renderEvent(newCalEvent, $weekDay);
              $newEvent.remove();

              if (!options.allowCalEventOverlap) {
                self._adjustForEventCollisions($weekDay, $renderedCalEvent, newCalEvent, newCalEvent);
                self._positionEvent($weekDay, $renderedCalEvent);
              } else {
                self._adjustOverlappingEvents($weekDay);
              }

              var proceed = self._trigger('beforeEventNew', event, {
                'calEvent': newCalEvent,
                'createdFromSingleClick': createdFromSingleClick,
                'calendar': self.element
              });

              if (proceed) {
                options.eventNew(newCalEvent, $renderedCalEvent, freeBusyManager, self.element, event);
                self.processed = true;
              }
              else {
                $($renderedCalEvent).remove();
              }
            }
            options.eventMouseupNewEvent();
          }
        };

        self.move = function(event) {
          var $newEvent = self.move.$newEvent,
              columnOffset = self.move.columnOffset,
              topPosition = self.move.topPosition,
              pageY = 0,
              touch;

          console.log('columnOffset, '+columnOffset+' topPosition, '+topPosition);
          $newEvent.show();
          $newEvent.addClass('ui-resizable-resizing');
          if (event.touches !== undefined){
            touch = event.touches[0];
            pageY = touch.pageY;
          } else if (event.gesture !== undefined && event.gesture.touches !== undefined){
            touch = event.gesture.touches[0];
            pageY = touch.pageY;
          } else if (event.originalEvent !== undefined && event.originalEvent.targetTouches !== undefined){
            touch = event.originalEvent.targetTouches[0];
            pageY = touch.pageY;
          } else {
            pageY = event.pageY;
          }
          var height = Math.round(pageY - columnOffset - topPosition);
          var remainder = height % options.timeslotHeight;
          console.log('pageY '+pageY+ ' height, '+height+' remainder, '+remainder);
          // Snap to closest timeslot
          if (remainder < 0) {
            var useHeight = height - remainder;
            $newEvent.css('height', useHeight < options.timeslotHeight ? options.timeslotHeight : useHeight);
          } else {
            $newEvent.css('height', height + (options.timeslotHeight - remainder));
          }
         
          console.log('css(height), '+$newEvent.css('height'));
        };

        self.removeEventAddClass = function($event) {
          console.log('removeEventAddClass');
          
          var $newEvent = self.removeEventAddClass.$newEvent,
           $target = self.removeEventAddClass.$target;

          console.log('off move, '+$target[0].className);

          off($target, events.move, self.move);
          off($target, events.up, self.removeEventAddClass);
          $newEvent.addClass('ui-corner-all');
        };

        self.getTopPosition = function(event){
          var columnOffset = $(event.target).offset().top,
            clickY = 0,
            touch;
          if (event.touches !== undefined){
            touch = event.touches[0];
            clickY = touch.pageY - columnOffset;
          } else if (event.gesture !== undefined && event.gesture.touches !== undefined){
            touch = event.gesture.touches[0];
            clickY = touch.pageY - columnOffset;
          } else if (event.originalEvent !== undefined && event.originalEvent.targetTouches !== undefined){
            touch = event.originalEvent.targetTouches[0];
            clickY = touch.pageY - columnOffset;
          } else {
            clickY = event.pageY - columnOffset;
          }
          
          var clickYRounded = (clickY - (clickY % options.timeslotHeight)) / options.timeslotHeight;
          var topPosition = clickYRounded * options.timeslotHeight;
          return topPosition;
        };

        self.downEventCreation = function(event) {
          console.log('downEventCreation');

          var $target = $(event.target);
          if ($target.hasClass('wc-day-column-inner')) {
            var $newEvent = $('<div class=\"wc-cal-event wc-new-cal-event wc-new-cal-event-creating\"></div>');
            $newEvent.css({lineHeight: (options.timeslotHeight - 2) + 'px', fontSize: (options.timeslotHeight / 2) + 'px'});
            $target.append($newEvent);

            var columnOffset = $target.offset().top;
            var topPosition = self.getTopPosition(event);

            //TODO: this is a Monkey Patch
            self.move.columnOffset = columnOffset;
            self.move.topPosition = topPosition;
            self.move.$newEvent = $newEvent;
            self.removeEventAddClass.$target = $target;
            self.removeEventAddClass.$newEvent = $newEvent;

            $newEvent.css({top: topPosition});

            if (!options.preventDragOnEventCreation) {
             
              console.log('on move, '+$target[0].className);

              on($target, events.move, self.move);
              on($target, events.up, self.removeEventAddClass);
            }
            self.lastValidTagert = $target;
            options.eventMousedownNewEvent();
            on($('html'), events.up, self.upEventCreation);
          }
        };
        on($weekDay, events.hold, self.downEventCreation);
      },

      /*
       * Load calendar events for the week based on the date provided
       */
      _loadCalEvents: function(dateWithinWeek, onlyPersistedItem) {
        var date, weekStartDate, weekEndDate, $weekDayColumns;
        var self = this;
        var options = this.options;
        date = this._fixMinMaxDate(dateWithinWeek || options.date);

        if ((!date || !date.getTime) || (!options.date || !options.date.getTime) || date.getTime() !== options.date.getTime()) {
          this._trigger('changedate', this.element, date);
        }

        this.options.date = date;
        weekStartDate = self._dateFirstDayOfWeek(date);
        weekEndDate = self._dateLastMilliOfWeek(date);

        options.calendarBeforeLoad(self.element);

        self.element.data('startDate', weekStartDate);
        self.element.data('endDate', weekEndDate);

        $weekDayColumns = self.element.find('.wc-day-column-inner');

        self._updateDayColumnHeader($weekDayColumns);

        // Load events by chosen means
        if (typeof options.data === 'string') {
          if (options.loading) {
            options.loading(true);
          }

          if (_currentAjaxCall) {
            // First abort current request (doesn't work if jQuery <= 1.4)
            _currentAjaxCall.abort();
          }

          var jsonOptions = self._getJsonOptions();
          jsonOptions[options.startParam || 'start'] = Math.round(weekStartDate.getTime() / 1000);
          jsonOptions[options.endParam || 'end'] = Math.round(weekEndDate.getTime() / 1000);
          _currentAjaxCall = $.ajax({
            url: options.data,
            data: jsonOptions,
            dataType: 'json',
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              if (errorThrown !== 'abort' && XMLHttpRequest.status !== 0) {
                alert('unable to get data, error:' + textStatus);
              }
            },

            success: function(data) {
              self._renderEvents(data, $weekDayColumns, onlyPersistedItem);
            },

            complete: function() {
              _currentAjaxCall = null;
              if (options.loading) {
                options.loading(false);
              }
            }
          });
        } else if ($.isFunction(options.data)) {
          options.data(weekStartDate, weekEndDate, function(data) {
            self._renderEvents(data, $weekDayColumns, onlyPersistedItem);
          });
        } else if (options.data) {
          self._renderEvents(options.data, $weekDayColumns, onlyPersistedItem);
        }
      },

      /*
       * Draws a thin line which indicates the current time.
       */
      _drawCurrentHourLine: function() {
        var d = new Date();
        var options = this.options;
        var businessHours = options.businessHours;

        // First, we remove the old hourline if it exists
        $('.wc-hourline', this.element).remove();

        // The line does not need to be displayed
        if (businessHours.limitDisplay && d.getHours() > businessHours.end) {
          return;
        }

        // Then we recreate it
        var paddingStart = businessHours.limitDisplay ? businessHours.start : 0;
        var nbHours = d.getHours() - paddingStart + d.getMinutes() / 60;
        var positionTop = nbHours * options.timeslotHeight * options.timeslotsPerHour;
        var lineWidth = $('.wc-scrollable-grid .wc-today', this.element).width() + 3;

        $('.wc-scrollable-grid .wc-today', this.element).append(
          $('<div>', {
            'class': 'wc-hourline',
            style: 'top: ' + positionTop + 'px; width: ' + lineWidth + 'px'
          })
        );
      },

      /*
       * Update the display of each day column header based on the calendar week
       */
      _updateDayColumnHeader: function($weekDayColumns) {
        var self = this;
        var options = this.options;
        var currentDay = self._cloneDate(self.element.data('startDate'));
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        var todayClass = 'state-active wc-today';

        self.element.find('.wc-header th.wc-day-column-header').each(function(i, val) {
          $(this).html(self._getHeaderDate(currentDay));
          if (self._isToday(currentDay)) {
            $(this).addClass(todayClass);
          } else {
            $(this).removeClass(todayClass);
          }
          currentDay = self._addDays(currentDay, 1);
        });

        currentDay = self._cloneDate(self.element.data('startDate'));
        if (showAsSeparatedUser)
        {
          self.element.find('.wc-header th.wc-user-header').each(function(i, val) {
            if (self._isToday(currentDay)) {
              $(this).addClass(todayClass);
            } else {
              $(this).removeClass(todayClass);
            }
            currentDay = ((i + 1) % options.users.length) ? currentDay : self._addDays(currentDay, 1);
          });
        }

        currentDay = self._cloneDate(self.element.data('startDate'));

        $weekDayColumns.each(function(i, val) {
          $(this).data('startDate', self._cloneDate(currentDay));
          $(this).data('endDate', new Date(currentDay.getTime() + (MILLIS_IN_DAY)));
          if (self._isToday(currentDay)) {
            $(this).parent()
            .addClass(todayClass)
            .removeClass('state-default');
          } else {
            $(this).parent()
            .removeClass(todayClass)
            .addClass('state-default');
          }

          if (!(showAsSeparatedUser && ((i + 1) % options.users.length))) {
            currentDay = self._addDays(currentDay, 1);
          }
        });

        // Now update the freeBusy placeholders
        if (options.displayFreeBusys) {
          currentDay = self._cloneDate(self.element.data('startDate'));
          self.element.find('.wc-grid-row-freebusy .wc-column-freebusy').each(function(i, val) {
            $(this).data('startDate', self._cloneDate(currentDay));
            $(this).data('endDate', new Date(currentDay.getTime() + (MILLIS_IN_DAY)));
            if (!(showAsSeparatedUser && ((i + 1) % options.users.length))) {
              currentDay = self._addDays(currentDay, 1);
            }
          });
        }

        // Now update the calendar title
        if (this.options.title) {
          var date = this.options.date,
              start = self._cloneDate(self.element.data('startDate')),
              end = self._dateLastDayOfWeek(new Date(this._cloneDate(self.element.data('endDate')).getTime() - (MILLIS_IN_DAY))),
              title = this._getCalendarTitle();

          // Replace the placeholders contained in the title
          title = title.replace('%start%', utils.formatDate(start, options.dateFormat));
          title = title.replace('%end%', utils.formatDate(end, options.dateFormat));
          title = title.replace('%date%', utils.formatDate(date, options.dateFormat));

          $('.wc-toolbar .wc-title', self.element).html(title);
        }
        //self._clearFreeBusys();
      },

      /*
       * Gets the calendar raw title.
       */
      _getCalendarTitle: function() {
        if ($.isFunction(this.options.title)) {
          return this.options.title(this.options.daysToShow);
        }

        return this.options.title || '';
      },

      /*
       * Render the events into the calendar
       */
      _renderEvents: function(data, $weekDayColumns, onlyPersistedItem) {
        var self = this;
        var options = this.options;
        var eventsToRender, nbRenderedEvents = 0;

        if (data.options) {
          var updateLayout = false;
          // Update options
          $.each(data.options, function(key, value) {
            if (value !== options[key]) {
              options[key] = value;
              updateLayout = updateLayout || $.ui.weekCalendar.updateLayoutOptions[key];
            }
          });

          self._computeOptions();

          if (updateLayout) {
            var hour = self._getCurrentScrollHour();
            self.element.empty();
            self._renderCalendar();
            $weekDayColumns = self.element.find('.wc-time-slots .wc-day-column-inner');
            self._updateDayColumnHeader($weekDayColumns);
            self._resizeCalendar();
            self._scrollToHour(hour, false);
          }
        }

        this._clearCalendar(onlyPersistedItem);

        if ($.isArray(data)) {
          eventsToRender = self._cleanEvents(data);
        } else if (data.events) {
          eventsToRender = self._cleanEvents(data.events);
          self._renderFreeBusys(data);
        }

        // Render a multi day event as various event
        $.each(eventsToRender, function(i, calEvent) {
          var initialStart = new Date(calEvent.start),
              initialEnd = new Date(calEvent.end),
              maxHour = self.options.businessHours.limitDisplay ? self.options.businessHours.end : 24,
              minHour = self.options.businessHours.limitDisplay ? self.options.businessHours.start : 0,
              start = new Date(initialStart),
              startDate = utils.formatDate(start, options.dateFormat),
              endDate = utils.formatDate(initialEnd, options.dateFormat),
              $weekDay,
              isMultiday = false;

          while (startDate < endDate) {
            calEvent.start = start;

            // End of this virual calEvent is set to the end of the day
            calEvent.end.setFullYear(start.getFullYear());
            calEvent.end.setDate(start.getDate());
            calEvent.end.setMonth(start.getMonth());
            calEvent.end.setHours(maxHour, 0, 0);

            if (($weekDay = self._findWeekDayForEvent(calEvent, $weekDayColumns))) {
              self._renderEvent(calEvent, $weekDay);
              nbRenderedEvents += 1;
            }

            // Start is set to the begin of the new day
            start.setDate(start.getDate() + 1);
            start.setHours(minHour, 0, 0);

            startDate = utils.formatDate(start, options.dateFormat);
            isMultiday = true;
          }

          if (start <= initialEnd) {
            calEvent.start = start;
            calEvent.end = initialEnd;

            if (((isMultiday && calEvent.start.getTime() !== calEvent.end.getTime()) || !isMultiday) && ($weekDay = self._findWeekDayForEvent(calEvent, $weekDayColumns))) {
              self._renderEvent(calEvent, $weekDay);
              nbRenderedEvents += 1;
            }
          }

          // Put back the initial start date
          calEvent.start = initialStart;
        });

        $weekDayColumns.each(function() {
          self._adjustOverlappingEvents($(this));
        });

        options.calendarAfterLoad(self.element);

        if (_hourLineTimeout){
          clearInterval(_hourLineTimeout);
        }

        if (options.hourLine) {
          self._drawCurrentHourLine();

          _hourLineTimeout = setInterval(function() {
            self._drawCurrentHourLine();
          }, 60 * 1000);
        }

        if (!nbRenderedEvents) {
          options.noEvents();
        }
      },

      /*
        * Render a specific event into the day provided. Assumes correct
        * day for calEvent date
        */
      _renderEvent: function(calEvent, $weekDay) {
        var self = this;
        var options = this.options;
        if (calEvent.start.getTime() > calEvent.end.getTime()) {
          // Don't render a negative height
          return;
        }

        var eventClass, eventHtml, $calEventList, $modifiedEvent;

        eventClass = calEvent.id ? 'wc-cal-event' : 'wc-cal-event wc-new-cal-event';
        eventHtml = '<div class=\"' + eventClass + ' ui-corner-all\">';
        eventHtml += '<div class=\"wc-time ui-corner-top\"></div>';
        eventHtml += '<div class=\"wc-title\"></div></div>';

        $weekDay.each(function() {
          var $calEvent = $(eventHtml);
          $modifiedEvent = options.eventRender(calEvent, $calEvent);
          $calEvent = $modifiedEvent ? $modifiedEvent.appendTo($(this)) : $calEvent.appendTo($(this));
          $calEvent.css({lineHeight: (options.textSize + 2) + 'px', fontSize: options.textSize + 'px'});

          self._refreshEventDetails(calEvent, $calEvent);
          self._positionEvent($(this), $calEvent);

          // Add to event list
          if ($calEventList) {
            $calEventList = $calEventList.add($calEvent);
          }
          else {
            $calEventList = $calEvent;
          }
        });

        $calEventList.show();

        if (!options.readonly && options.resizable(calEvent, $calEventList)) {
          self._addResizableToCalEvent(calEvent, $calEventList, $weekDay);
        }

        if (!options.readonly && options.draggable(calEvent, $calEventList)) {
          console.log('added _addDraggableToCalEvent');
          self._addDraggableToCalEvent(calEvent, $calEventList);
        }

        options.eventAfterRender(calEvent, $calEventList);
        return $calEventList;
      },

      addEvent: function() {
        return this._renderEvent.apply(this, arguments);
      },

      _adjustOverlappingEvents: function($weekDay) {
        var self = this;
        if (self.options.allowCalEventOverlap) {
          var groupsList = self._groupOverlappingEventElements($weekDay);
          $.each(groupsList, function() {
            var curGroups = this;
            $.each(curGroups, function(groupIndex) {
              var curGroup = this;
              var newWidth, newLeft;

              // Do we want events to be displayed as overlapping
              if (self.options.overlapEventsSeparate) {
                newWidth = self.options.totalEventsWidthPercentInOneColumn / curGroups.length;
                newLeft = groupIndex * newWidth;
              } else {
                // TODO: what happens when the group has more than 10 elements
                newWidth = self.options.totalEventsWidthPercentInOneColumn - ((curGroups.length - 1) * 10);
                newLeft = groupIndex * 10;
              }
              $.each(curGroup, function() {
                // Bring mouseovered event to the front
                if (!self.options.overlapEventsSeparate) {
                  $(this).bind('mouseover.z-index', function() {
                    var $elem = $(this);
                    $.each(curGroup, function() {
                      $(this).css({'z-index': '1'});
                    });
                    $elem.css({'z-index': '3'});
                  });
                }
                $(this).css({width: newWidth + '%', left: newLeft + '%', right: 0});
              });
            });
          });
        }
      },

      /*
        * Find groups of overlapping events
        */
      _groupOverlappingEventElements: function($weekDay) {
        var $events = $weekDay.find('.wc-cal-event:visible');
        var sortedEvents = $events.sort(function(a, b) {
          return $(a).data('calEvent').start.getTime() - $(b).data('calEvent').start.getTime();
        });

        var lastEndTime = new Date(0, 0, 0);
        var groups = [];
        var curGroups = [];
        var $curEvent;
        $.each(sortedEvents, function() {
          $curEvent = $(this);
          // Checks, if the current group list is not empty, if the overlapping is finished
          if (curGroups.length > 0) {
            if (lastEndTime.getTime() <= $curEvent.data('calEvent').start.getTime()) {
              // Finishes the current group list by adding it to the resulting list of groups and cleans it
              groups.push(curGroups);
              curGroups = [];
            }
          }

          // Finds the first group to fill with the event
          for (var groupIndex = 0; groupIndex < curGroups.length; groupIndex++) {
            if (curGroups[groupIndex].length > 0) {
              // Checks if the event starts after the end of the last event of the group
              if (curGroups[groupIndex][curGroups[groupIndex].length - 1].data('calEvent').end.getTime() <= $curEvent.data('calEvent').start.getTime()) {
                curGroups[groupIndex].push($curEvent);
                if (lastEndTime.getTime() < $curEvent.data('calEvent').end.getTime()) {
                  lastEndTime = $curEvent.data('calEvent').end;
                }
                return;
              }
            }
          }

          // If not found, creates a new group
          curGroups.push([$curEvent]);
          if (lastEndTime.getTime() < $curEvent.data('calEvent').end.getTime()) {
            lastEndTime = $curEvent.data('calEvent').end;
          }
        });

        // Adds the last groups in result
        if (curGroups.length > 0) {
          groups.push(curGroups);
        }

        return groups;
      },


      /*
       * Find the weekday in the current calendar that the calEvent falls within
       */
      _findWeekDayForEvent: function(calEvent, $weekDayColumns) {
        //console.log('_findWeekDayForEvent');
        var $weekDay;
        var options = this.options;
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        var user_ids = this._getEventUserId(calEvent);

        if (!$.isArray(user_ids)) {
          user_ids = [user_ids];
        }

        $weekDayColumns.each(function(index, curDay) {
          if ($(this).data('startDate').getTime() <= calEvent.start.getTime() &&
                $(this).data('endDate').getTime() >= calEvent.end.getTime() &&
                (!showAsSeparatedUser || $.inArray($(this).data('wcUserId'), user_ids) !== -1)) {
            if ($weekDay) {
              $weekDay = $weekDay.add($(curDay));
            }
            else {
              $weekDay = $(curDay);
            }
          }
        });

        return $weekDay;
      },

      /*
       * Update the events rendering in the calendar. Add if does not yet exist.
       */
      _updateEventInCalendar: function(calEvent) {
        //console.log('_updateEventInCalendar');
        var self = this;
        self._cleanEvent(calEvent);

        /* TODO: avoid this useless loop. Use selector to find event */
        if (typeof calEvent.id !== 'undefined') {
          self.element.find('.wc-cal-event').each(function() {
            if ($(this).data('calEvent').id === calEvent.id || $(this).hasClass('wc-new-cal-event')) {
              $(this).remove();
              return false;
            }
          });
        }

        var $weekDays = self._findWeekDayForEvent(calEvent, self.element.find('.wc-grid-row-events .wc-day-column-inner'));
        if ($weekDays) {
          $weekDays.each(function(index, weekDay) {
            var $weekDay = $(weekDay);
            var $calEvent = self._renderEvent(calEvent, $weekDay);
            self._adjustForEventCollisions($weekDay, $calEvent, calEvent, calEvent);
            self._refreshEventDetails(calEvent, $calEvent);
            self._positionEvent($weekDay, $calEvent);
            self._adjustOverlappingEvents($weekDay);
          });
        }
      },

      /*
       * Position the event element within the weekday based on it's start / end dates.
       */
      _positionEvent: function($weekDay, $calEvent) {
        //console.log('_positionEvent');
        var options = this.options;
        var calEvent = $calEvent.data('calEvent');
        var pxPerMillis = $weekDay.height() / options.millisToDisplay;
        var firstHourDisplayed = options.businessHours.limitDisplay ? options.businessHours.start : 0;
        var startMillis = this._getDSTdayShift(calEvent.start).getTime() - this._getDSTdayShift(new Date(calEvent.start.getFullYear(), calEvent.start.getMonth(), calEvent.start.getDate(), firstHourDisplayed)).getTime();
        var eventMillis = this._getDSTdayShift(calEvent.end).getTime() - this._getDSTdayShift(calEvent.start).getTime();
        var pxTop = pxPerMillis * startMillis;
        var pxHeight = pxPerMillis * eventMillis;
        // var pxHeightFallback = pxPerMillis * (60 / options.timeslotsPerHour) * 60 * 1000;
        $calEvent.css({top: pxTop, height: pxHeight || (pxPerMillis * 3600000 / options.timeslotsPerHour)});
      },

      /*
       * Determine the actual start and end times of a calevent based on it's
       * relative position within the weekday column and the starting hour of the
       * displayed calendar.
       */
      _getEventDurationFromPositionedEventElement: function($weekDay, $calEvent, top) {
        var options = this.options;
        var startOffsetMillis = options.businessHours.limitDisplay ? options.businessHours.start * 3600000 : 0;
        var start = new Date($weekDay.data('startDate').getTime() + startOffsetMillis + Math.round(top / options.timeslotHeight) * options.millisPerTimeslot);
        var end = new Date(start.getTime() + ($calEvent.height() / options.timeslotHeight) * options.millisPerTimeslot);
        return {start: this._getDSTdayShift(start, -1), end: this._getDSTdayShift(end, -1)};
      },

      /*
       * If the calendar does not allow event overlap, adjust the start or end date if necessary to
       * avoid overlapping of events. Typically, shortens the resized / dropped event to it's max possible
       * duration  based on the overlap. If no satisfactory adjustment can be made, the event is reverted to
       * it's original location.
       */
      _adjustForEventCollisions: function($weekDay, $calEvent, newCalEvent, oldCalEvent, maintainEventDuration) {
        var options = this.options;

        if (options.allowCalEventOverlap) {
          return;
        }

        var adjustedStart, adjustedEnd;
        var self = this;

        $weekDay.find('.wc-cal-event').not($calEvent).each(function() {
          var currentCalEvent = $(this).data('calEvent');

          // Has been dropped onto existing event overlapping the end time
          if (newCalEvent.start.getTime() < currentCalEvent.end.getTime() &&
                newCalEvent.end.getTime() >= currentCalEvent.end.getTime()) {
            adjustedStart = currentCalEvent.end;
          }

          // Has been dropped onto existing event overlapping the start time
          if (newCalEvent.end.getTime() > currentCalEvent.start.getTime() &&
                newCalEvent.start.getTime() <= currentCalEvent.start.getTime()) {
            adjustedEnd = currentCalEvent.start;
          }
          // Has been dropped inside existing event with same or larger duration
          if (oldCalEvent.resizable === false ||
                (newCalEvent.end.getTime() <= currentCalEvent.end.getTime() &&
                  newCalEvent.start.getTime() >= currentCalEvent.start.getTime())) {
            adjustedStart = oldCalEvent.start;
            adjustedEnd = oldCalEvent.end;
            return false;
          }
        });

        newCalEvent.start = adjustedStart || newCalEvent.start;

        if (adjustedStart && maintainEventDuration) {
          newCalEvent.end = new Date(adjustedStart.getTime() + (oldCalEvent.end.getTime() - oldCalEvent.start.getTime()));
          self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, oldCalEvent);
        } else {
          newCalEvent.end = adjustedEnd || newCalEvent.end;
        }

        // Reset if new cal event has been forced to zero size
        if (newCalEvent.start.getTime() >= newCalEvent.end.getTime()) {
          newCalEvent.start = oldCalEvent.start;
          newCalEvent.end = oldCalEvent.end;
        }

        $calEvent.data('calEvent', newCalEvent);
      },

      /*
       * Add draggable capabilities to an event
       */
      _addDraggableToCalEvent: function(calEvent, $calEvent) {
        var isMobile = TimelyUi.compat.isMobile;
        var options = this.options;
        var functionStart = function(event, ui) {
            options.tic = 0;
            options.dragTicTime = new Date().getTime();
            console.log('_addDraggableToCalEvent start');
            var $calEvent = ui.draggable || ui.helper;
            console.log('executing start event, '+event.type+' $calEvent, '+$calEvent);
            options.eventDrag(calEvent, $calEvent);
        };
        options.dragTicTime = undefined;
        $calEvent.draggable({
          handle: (isMobile)? '' : '.wc-time',
          containment: 'div.wc-time-slots',
          snap: '.wc-day-column-inner',
          snapMode: 'inner',
          snapTolerance: options.timeslotHeight - 1,
          revert: 'invalid',
          opacity: 0.5,
          grid: [$calEvent.outerWidth() + 1, options.timeslotHeight],
          create: function (event, ui){
             var isMobile = TimelyUi.compat.isMobile;
             var on = TimelyUi.compat.on;
             var events = TimelyUi.compat.events;
             if (isMobile){
               on($(this.querySelector('.wc-time')), events['hold'], function(ui){
                 console.log('try to cast start event, '+event.type);

                 return function(event) {
                   //var $calEvent = ui.draggable || ui.helper;
                   var myEvent = jQuery.Event('dragstart');

                   functionStart(myEvent, ui);
                 }
               }(ui));
               console.log('ui');
             }

          },

          start: functionStart,
          /* only in desktop enviroment */
          drag: function(event, ui) {
            var isMobile = TimelyUi.compat.isMobile;
            if(isMobile){
              return;
            }
            var options = TimelyUi.calendar.options,
			    maxColumnNumber = TimelyUi.maxColumnNumber;

            console.log('sliding drag logic');
            var width = $calEvent.outerWidth();
            if (event.clientX + ui.position.left > window.screen.availWidth - 100 && new Date().getTime() > options.dragTicTime + 600 && maxColumnNumber < options.users.length){
              options.dragTicTime = new Date().getTime();
              if (TimelyUi.columnsToShow !== 1){
                $('.wc-go-right').click();
                $('html').mouseup();
              }
              return false;
            }
            if (ui.offset.left < 50 && event.clientX + ui.position.left < 100 && new Date().getTime() > options.dragTicTime + 600 && maxColumnNumber < options.users.length){
              options.dragTicTime = new Date().getTime();
              if (TimelyUi.columnsToShow !== 1){
                $('.wc-go-left').click();
                $('html').mouseup();
              }
              return false;
            }
          }
        });
      },

      /*
        * Add droppable capabilites to weekdays to allow dropping of calEvents only
        */
      _addDroppableToWeekDay: function($weekDay) {
        var self = this;
        var options = this.options;
        $weekDay.droppable({
          accept: '.wc-cal-event',
          drop: function(event, ui) {
            //console.log('_addDroppableToWeekDay drop');
            var $calEvent = ui.draggable;
            var top = Math.round(parseInt(ui.position.top, 10));
            var eventDuration = self._getEventDurationFromPositionedEventElement($weekDay, $calEvent, top);
            var calEvent = $calEvent.data('calEvent');
            var newCalEvent = $.extend(true, {}, calEvent, {start: eventDuration.start, end: eventDuration.end});
            var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
            if (showAsSeparatedUser) {
              // we may have dragged the event on column with a new user.
              // nice way to handle that is:
              //  - get the newly dragged on user
              //  - check if user is part of the event
              //  - if yes, nothing changes, if not, find the old owner to remove it and add new one
              var newUserId = $weekDay.data('wcUserId');
              var userIdList = self._getEventUserId(calEvent);
              var oldUserId = $(ui.draggable.parents('.wc-day-column-inner').get(0)).data('wcUserId');
              if (!$.isArray(userIdList)) {
                userIdList = [userIdList];
              }
              if ($.inArray(newUserId, userIdList) === -1) {
                // Remove old user
                var _index = $.inArray(oldUserId, userIdList);
                userIdList.splice(_index, 1);
                // Add new user ?
                if ($.inArray(newUserId, userIdList) === -1) {
                  userIdList.push(newUserId);
                }
              }
              newCalEvent = self._setEventUserId(newCalEvent, ((userIdList.length === 1) ? userIdList[0] : userIdList));
            }
            self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, calEvent, true);
            var $weekDayColumns = self.element.find('.wc-day-column-inner');

            // Trigger drop callback
            options.eventDrop(newCalEvent, calEvent, $calEvent);

            var $newEvent = self._renderEvent(newCalEvent, self._findWeekDayForEvent(newCalEvent, $weekDayColumns));
            $calEvent.hide();

            $calEvent.data('preventClick', true);

            var $weekDayOld = self._findWeekDayForEvent($calEvent.data('calEvent'), self.element.find('.wc-time-slots .wc-day-column-inner'));

            if ($weekDayOld.data('startDate') !== $weekDay.data('startDate')) {
              self._adjustOverlappingEvents($weekDayOld);
            }
            self._adjustOverlappingEvents($weekDay);

            $calEvent.remove();
          }
        });
      },

      /*
       * Add resizable capabilities to a calEvent
       */
      _addResizableToCalEvent: function(calEvent, $calEvent, $weekDay) {
        var self = this;
        var options = this.options;
        var isMobile = TimelyUi.compat.isMobile;
        $calEvent.resizable({
          containment: (isMobile)? 'parent' : $weekDay,
          grid: options.timeslotHeight,
          handles: (isMobile)? '' : 's',
          minHeight: options.timeslotHeight,
          start: function(event, ui) {
            TimelyUi.utils.disableIScrolls();
          },
          stop: function(event, ui) {
            TimelyUi.utils.enableIScrolls();
            var $calEvent = ui.element;
            var newEnd = new Date($calEvent.data('calEvent').start.getTime() + Math.max(1, Math.round(ui.size.height / options.timeslotHeight)) * options.millisPerTimeslot);
            if (self._needDSTdayShift($calEvent.data('calEvent').start, newEnd)) {
              newEnd = self._getDSTdayShift(newEnd, -1);
            }

            var newCalEvent = $.extend(true, {}, calEvent, {start: calEvent.start, end: newEnd});
            self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, calEvent);

            // Trigger resize callback
            options.eventResize(newCalEvent, calEvent, $calEvent);
            self._refreshEventDetails(newCalEvent, $calEvent);
            self._positionEvent($weekDay, $calEvent);
            self._adjustOverlappingEvents($weekDay);
            $calEvent.data('preventClick', true);
            setTimeout(function() {
              $calEvent.removeData('preventClick');
            }, 500);
          }
        });

        $('.ui-resizable-handle', $calEvent).html('===');
        $('.ui-resizable-handle').addClass('wc-resizable');
      },

      /*
       * Refresh the displayed details of a calEvent in the calendar
       */
      _refreshEventDetails: function(calEvent, $calEvent) {
        var suffix = '';
        if (!this.options.readonly && this.options.allowEventDelete && this.options.deletable(calEvent,$calEvent)) {
          suffix = '<div class="wc-cal-event-delete ui-icon ui-icon-close"></div>';
        }

        $calEvent.find('.wc-time').html(this.options.eventHeader(calEvent, this.element) + suffix);
        $calEvent.find('.wc-title').html(this.options.eventBody(calEvent, this.element));
        $calEvent.data('calEvent', calEvent);
        this.options.eventRefresh(calEvent, $calEvent);
      },

      /*
       * Clear all cal events from the calendar
       */
      _clearCalendar: function(onlyPersistedItem) {
        var eventsToClear = [];

        if (onlyPersistedItem) {
          eventsToClear = this.element.find('.wc-cal-event').not('.wc-new-cal-event');
        } else {
          eventsToClear = this.element.find('.wc-day-column-inner div')
        }

        eventsToClear.remove();
      },

      /*
       * Scroll the calendar to a specific hour
       */
      _scrollToHour: function(hour, animate) {
        var self = this;
        var options = this.options;
        var iscroll = TimelyUi.iScrollEls[0];
        var $scrollable = this.element.find('.wc-scroller-height');
        if (iscroll !== undefined){
          var slot = hour;
          if (self.options.businessHours.limitDisplay) {
            if (hour <= self.options.businessHours.start) {
              slot = 0;
            } else if (hour >= self.options.businessHours.end) {
              slot = self.options.businessHours.end - self.options.businessHours.start - 1;
            } else {
              slot = hour - self.options.businessHours.start;
            }
          }
          var $target = this.element.find('.wc-grid-timeslot-header .wc-hour-header:eq(' + slot + ')');
          var targetOffset = $target.offset().top;
          var scroll = targetOffset - $scrollable.offset().top - $target.outerHeight();
          iscroll.scrollTo(0, -scroll, 0);
        }
      },

      _24HourForIndex: function(index) {
        if (index === 0) {
          return '00:00';
        } else if (index < 10) {
          return '0' + index + ':00';
        } else {
          return index + ':00';
        }
      },

      _amOrPm: function(hourOfDay) {
        return hourOfDay < 12 ? 'AM' : 'PM';
      },

      _isToday: function(date) {
        var clonedDate = this._cloneDate(date);
        this._clearTime(clonedDate);
        var today = new Date();
        this._clearTime(today);
        return today.getTime() === clonedDate.getTime();
      },

      /*
       * Clean events to ensure correct format
       */
      _cleanEvents: function(events) {
        var self = this;
        $.each(events, function(i, event) {
          self._cleanEvent(event);
        });
        return events;
      },

      /*
       * Clean specific event
       */
      _cleanEvent: function(event) {
        if (event.date) {
          event.start = event.date;
        }
        event.start = this._cleanDate(event.start);
        event.end = this._cleanDate(event.end);
        if (!event.end) {
          event.end = this._addDays(this._cloneDate(event.start), 1);
        }
      },

      /*
       * Returns the date on the first millisecond of the week
       */
      _dateFirstDayOfWeek: function(date) {
        var self = this;
        var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var adjustedDate = new Date(midnightCurrentDate);
        adjustedDate.setDate(adjustedDate.getDate() - self._getAdjustedDayIndex(midnightCurrentDate));

        return adjustedDate;
      },

      /*
       * Returns the date on the first millisecond of the last day of the week
       */
      _dateLastDayOfWeek: function(date) {
        var self = this;
        var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var adjustedDate = new Date(midnightCurrentDate);
        var daysToAdd = (self.options.daysToShow - 1 - self._getAdjustedDayIndex(midnightCurrentDate));
        adjustedDate.setDate(adjustedDate.getDate() + daysToAdd);

        return adjustedDate;
      },

      /*
       * Fix the date if it is not within given options minDate and maxDate
       */
      _fixMinMaxDate: function(date) {
        var minDate, maxDate;
        date = this._cleanDate(date);

        // Not less than minDate
        if (this.options.minDate) {
          minDate = this._cleanDate(this.options.minDate);
          // Midnight on minDate
          minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
          if (date.getTime() < minDate.getTime()) {
            this._trigger('reachedmindate', this.element, date);
          }
          date = this._cleanDate(Math.max(date.getTime(), minDate.getTime()));
        }

        // Not more than maxDate
        if (this.options.maxDate) {
          maxDate = this._cleanDate(this.options.maxDate);
          // Apply correction for max date if not startOnFirstDayOfWeek
          // to make sure no further date is displayed.
          // otherwise, the complement will still be shown
          if (!this._startOnFirstDayOfWeek()) {
            var day = maxDate.getDate() - this.options.daysToShow + 1;
            maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), day);
          }
          // Microsecond before midnight on maxDate
          maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59, 999);
          if (date.getTime() > maxDate.getTime()) {
            this._trigger('reachedmaxdate', this.element, date);
          }
          date = this._cleanDate(Math.min(date.getTime(), maxDate.getTime()));
        }

        return date;
      },

      /*
       * Gets the index of the current day adjusted based on options
       */
      _getAdjustedDayIndex: function(date) {
        if (!this._startOnFirstDayOfWeek()) {
          return 0;
        }

        var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var currentDayOfStandardWeek = midnightCurrentDate.getDay();
        var days = [0, 1, 2, 3, 4, 5, 6];
        this._rotate(days, this._firstDayOfWeek());
        return days[currentDayOfStandardWeek];
      },

      _firstDayOfWeek: function() {
        if ($.isFunction(this.options.firstDayOfWeek)) {
          return this.options.firstDayOfWeek(this.element);
        }
        return this.options.firstDayOfWeek;
      },

      /*
       * Returns the date on the last millisecond of the week
       */
      _dateLastMilliOfWeek: function(date) {
        var lastDayOfWeek = this._dateLastDayOfWeek(date);
        lastDayOfWeek = this._cloneDate(lastDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 1);
        return lastDayOfWeek;
      },

      /*
       * Clear the time components of a date leaving the date
       * of the first milli of day
       */
      _clearTime: function(d) {
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
      },

      /*
       * Add specific number of days to date
       */
      _addDays: function(d, n, keepTime) {
        d.setDate(d.getDate() + n);
        if (keepTime) {
          return d;
        }
        return this._clearTime(d);
      },

      /*
       * Rotate an array by specified number of places.
       */
      _rotate: function(a /*array*/, p /* integer, positive integer rotate to the right, negative to the left... */) {
        var l = a.length;
        p = (Math.abs(p) >= l && (p %= l), p < 0 && (p += l), p);

        for (var i, x; p; p = (Math.ceil(l / p) - 1) * p - l + (l = p)) {
          for (i = l; i > p; x = a[--i], a[i] = a[i - p], a[i - p] = x) {}
        }
        return a;
      },

      _cloneDate: function(d) {
        return new Date(d.getTime());
      },

      /**
       * Return a Date instance for different representations.
       * @param {Object} date in any representations
       * @return {Date} The clean date object.
       */
      _cleanDate: function(date) {
        var utils = TimelyUi.utils;

        // If is a numeric timestamp written as String
        if (!isNaN(Number(date))) {
          date = Number(date);
        }

        return utils.toDate(date);
      },

      /* USER MANAGEMENT FUNCTIONS */

      getUserForId: function(id) {
        return $.extend({}, this.options.users[this._getUserIndexFromId(id)]);
      },

      /*
       * Return the user name for header
       */
      _getUserName: function(index) {
        var self = this;
        var options = this.options;
        var user = options.users[index];

        return $.isFunction(options.getUserName) ? options.getUserName(user, index, self.element) : user;
      },

      /*
       * Return the user id for given index
       */
      _getUserIdFromIndex: function(index) {
        var self = this;
        var options = this.options;

        return $.isFunction(options.getUserId) ? options.getUserId(options.users[index], index, self.element) : index;
      },

      /*
       * Returns the associated user index for given ID
       */
      _getUserIndexFromId: function(id) {
        var self = this;
        var options = this.options;
        for (var i = 0; i < options.users.length; i++) {
          if (self._getUserIdFromIndex(i) === id) {
            return i;
          }
        }
        return 0;
      },

      /*
       * Return the user ids for given calEvent.
       * default is calEvent.userId field.
       */
      _getEventUserId: function(calEvent) {
        var self = this;
        var options = this.options;
        if (options.showAsSeparateUsers && options.users && options.users.length) {
          if ($.isFunction(options.getEventUserId)) {
            return options.getEventUserId(calEvent, self.element);
          }
          return calEvent.userId;
        }
        return [];
      },

      /*
       * Sets the event user id on given calEvent
       * Default is calEvent.userId field.
       */
      _setEventUserId: function(calEvent, userId) {
        var self = this;
        var options = this.options;
        if ($.isFunction(options.setEventUserId)) {
          return options.setEventUserId(userId, calEvent, self.element);
        }
        calEvent.userId = userId;
        return calEvent;
      },

      /*
       * Return the user ids for given freeBusy.
       * Default is freeBusy.userId field.
       */
      _getFreeBusyUserId: function(freeBusy) {
        var self = this;
        var options = this.options;
        if ($.isFunction(options.getFreeBusyUserId)) {
          return options.getFreeBusyUserId(freeBusy.getOption(), self.element);
        }
        return freeBusy.getOption('userId');
      },

      /* FREEBUSY MANAGEMENT */

      /*
       * Clean the free busy managers and remove all the freeBusy
       */
      _clearFreeBusys: function() {
        if (this.options.displayFreeBusys) {
          var self = this;
          var options = this.options;
          var $freeBusyPlaceholders = self.element.find('.wc-grid-row-freebusy .wc-column-freebusy');

          $freeBusyPlaceholders.each(function() {
            $(this).data('wcFreeBusyManager', new FreeBusyManager({
              start: self._cloneDate($(this).data('startDate')),
              end: self._cloneDate($(this).data('endDate')),
              defaultFreeBusy: options.defaultFreeBusy || {}
            }));
          });
          self.element.find('.wc-grid-row-freebusy .wc-freebusy').remove();
        }
      },

      /*
       * Retrieve placeholders for given freebusy
       */
      _findWeekDaysForFreeBusy: function(freeBusy, $weekDays) {
        var self = this;
        var $returnWeekDays;
        var options = this.options;
        var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
        var userList = self._getFreeBusyUserId(freeBusy);

        if (!$.isArray(userList)) {
          userList = (typeof userList !== 'undefined') ? [userList] : [];
        }

        if (!$weekDays) {
          $weekDays = self.element.find('.wc-grid-row-freebusy .wc-column-freebusy');
        }

        $weekDays.each(function() {
          var manager = $(this).data('wcFreeBusyManager');
          var has_overlap = manager.isWithin(freeBusy.getStart()) ||
                              manager.isWithin(freeBusy.getEnd()) ||
                              freeBusy.isWithin(manager.getStart()) ||
                              freeBusy.isWithin(manager.getEnd());
          var userId = $(this).data('wcUserId');
          if (has_overlap && (!showAsSeparatedUser || ($.inArray(userId, userList) !== -1))) {
            $returnWeekDays = $returnWeekDays ? $returnWeekDays.add($(this)) : $(this);
          }
        });
        return $returnWeekDays;
      },

      /*
       * Used to render all freeBusys
       */
      _renderFreeBusys: function(freeBusys) {
        if (this.options.displayFreeBusys) {
          var self = this;
          var $freeBusyPlaceholders = self.element.find('.wc-grid-row-freebusy .wc-column-freebusy');
          var freebusysToRender;

          // Insert freebusys to dedicated placeholders freebusy managers
          if ($.isArray(freeBusys)) {
            freebusysToRender = self._cleanFreeBusys(freeBusys);
          } else if (freeBusys.freebusys) {
            freebusysToRender = self._cleanFreeBusys(freeBusys.freebusys);
          }
          else {
            freebusysToRender = [];
          }

          $.each(freebusysToRender, function(index, freebusy) {
              var $placeholders = self._findWeekDaysForFreeBusy(freebusy, $freeBusyPlaceholders);
              if ($placeholders) {
                $placeholders.each(function() {
                  var manager = $(this).data('wcFreeBusyManager');
                  manager.insertFreeBusy(new FreeBusy(freebusy.getOption()));
                  $(this).data('wcFreeBusyManager', manager);
                });
              }
            });

          // Now display freebusys on  place holders
          self._refreshFreeBusys($freeBusyPlaceholders);
        }
      },

      /*
       * Refresh freebusys for given placeholders
       */
      _refreshFreeBusys: function($freeBusyPlaceholders) {
        if (this.options.displayFreeBusys && $freeBusyPlaceholders) {
          var self = this;
          var options = this.options;
          var start = (options.businessHours.limitDisplay ? options.businessHours.start : 0);
          var end = (options.businessHours.limitDisplay ? options.businessHours.end : 24);

          $freeBusyPlaceholders.each(function() {
            var $placehoder = $(this);
            var s = self._cloneDate($placehoder.data('startDate'));
            var e = self._cloneDate(s);

            s.setHours(start);
            e.setHours(end);
            $placehoder.find('.wc-freebusy').remove();
            $.each($placehoder.data('wcFreeBusyManager').getFreeBusys(s, e), function() {
              self._renderFreeBusy(this, $placehoder);
            });
          });
        }
      },

      /*
       * Render a freebusy item on dedicated placeholders
       */
      _renderFreeBusy: function(freeBusy, $freeBusyPlaceholder) {
        if (this.options.displayFreeBusys) {
          var self = this;
          var options = this.options;
          var freeBusyHtml = '<div class="wc-freebusy"></div>';
          var $fb = $(freeBusyHtml);

          $fb.data('wcFreeBusy', new FreeBusy(freeBusy.getOption()));
          this._positionFreeBusy($freeBusyPlaceholder, $fb);
          $fb = options.freeBusyRender(freeBusy.getOption(), $fb, self.element);
          if ($fb) {
            $fb.appendTo($freeBusyPlaceholder);
          }
        }
      },

      /*
       * Position the freebusy element within the weekday based on it's start / end dates.
       */
      _positionFreeBusy: function($placeholder, $freeBusy) {
        var options = this.options;
        var freeBusy = $freeBusy.data('wcFreeBusy');
        var pxPerMillis = $placeholder.height() / options.millisToDisplay;
        var firstHourDisplayed = options.businessHours.limitDisplay ? options.businessHours.start : 0;
        var startMillis = freeBusy.getStart().getTime() - new Date(freeBusy.getStart().getFullYear(), freeBusy.getStart().getMonth(), freeBusy.getStart().getDate(), firstHourDisplayed).getTime();
        var eventMillis = freeBusy.getEnd().getTime() - freeBusy.getStart().getTime();
        var pxTop = pxPerMillis * startMillis;
        var pxHeight = pxPerMillis * eventMillis;

        $freeBusy.css({top: pxTop, height: pxHeight});
      },

      /*
       * Clean freebusys to ensure correct format
       */
      _cleanFreeBusys: function(freebusys) {
        var self = this;
        var freeBusyToReturn = [];

        if (!$.isArray(freebusys)) {
          freebusys = [freebusys];
        }

        $.each(freebusys, function(i, freebusy) {
          freeBusyToReturn.push(new FreeBusy(self._cleanFreeBusy(freebusy)));
        });
        return freeBusyToReturn;
      },

      /*
       * Clean specific freebusy
       */
      _cleanFreeBusy: function(freebusy) {
        if (freebusy.date) {
          freebusy.start = freebusy.date;
        }

        freebusy.start = this._cleanDate(freebusy.start);
        freebusy.end = this._cleanDate(freebusy.end);
        return freebusy;
      },

      /*
       * Retrives the first freebusy manager matching demand
       */
      getFreeBusyManagersFor: function(date, users) {
        var calEvent = {
          start: date,
          end: date
        };
        this._setEventUserId(calEvent, users);
        return this.getFreeBusyManagerForEvent(calEvent);
      },

      /*
       * Retrives the first freebusy manager for given event
       */
      getFreeBusyManagerForEvent: function(newCalEvent) {
        var self = this;
        var options = this.options;
        var freeBusyManager;

        if (options.displayFreeBusys) {
          var $freeBusyPlaceHoders = self.element.find('.wc-grid-row-freebusy .wc-column-freebusy');
          var freeBusy = new FreeBusy({start: newCalEvent.start, end: newCalEvent.end});
          var showAsSeparatedUser = options.showAsSeparateUsers && options.users && options.users.length;
          var userId = showAsSeparatedUser ? self._getEventUserId(newCalEvent) : null;

          if (!$.isArray(userId)) {
            userId = [userId];
          }

          $freeBusyPlaceHoders.each(function() {
            var manager = $(this).data('wcFreeBusyManager'),
                has_overlap = manager.isWithin(freeBusy.getEnd()) ||
                                manager.isWithin(freeBusy.getEnd()) ||
                                freeBusy.isWithin(manager.getStart()) ||
                                freeBusy.isWithin(manager.getEnd());
            if (has_overlap && (!showAsSeparatedUser || $.inArray($(this).data('wcUserId'), userId) !== -1)) {
              freeBusyManager = $(this).data('wcFreeBusyManager');
              return false;
            }
          });
        }
        return freeBusyManager;
      },

      /**
        * Appends the freebusys to replace the old ones.
        * @param {array|object} freeBusys freebusy(s) to apply.
        */
      updateFreeBusy: function(freeBusys) {
        var self = this;
        var options = this.options;

        if (options.displayFreeBusys) {
          var $toRender;
          var $freeBusyPlaceHoders = self.element.find('.wc-grid-row-freebusy .wc-column-freebusy');
          var _freeBusys = self._cleanFreeBusys(freeBusys);

          $.each(_freeBusys, function(index, _freeBusy) {
            var $weekdays = self._findWeekDaysForFreeBusy(_freeBusy, $freeBusyPlaceHoders);

            // If freebusy has a placeholder
            if ($weekdays && $weekdays.length) {
              $weekdays.each(function(index, day) {
                var manager = $(day).data('wcFreeBusyManager');
                manager.insertFreeBusy(_freeBusy);
                $(day).data('wcFreeBusyManager', manager);
              });
              $toRender = $toRender ? $toRender.add($weekdays) : $weekdays;
            }
          });
          self._refreshFreeBusys($toRender);
        }
      },

      /* NEW OPTIONS MANAGEMENT */

      /*
       * Checks wether or not the calendar should be displayed starting on first day of week
       */
      _startOnFirstDayOfWeek: function() {
        return jQuery.isFunction(this.options.startOnFirstDayOfWeek) ? this.options.startOnFirstDayOfWeek(this.element) : this.options.startOnFirstDayOfWeek;
      },

      /*
       * Finds out the current scroll to apply it when changing the view
       */
      _getCurrentScrollHour: function() {
        var self = this;
        var options = this.options;
        var $scrollable = this.element.find('.wc-scrollable-grid');
        var scroll = $scrollable.scrollTop();
        if (self.options.businessHours.limitDisplay) {
          scroll = scroll + options.businessHours.start * options.timeslotHeight * options.timeslotsPerHour;
        }
        return Math.round(scroll / (options.timeslotHeight * options.timeslotsPerHour)) + 1;
      },

      _getJsonOptions: function() {
        if ($.isFunction(this.options.jsonOptions)) {
          return $.extend({}, this.options.jsonOptions(this.element));
        }
        if ($.isPlainObject(this.options.jsonOptions)) {
          return $.extend({}, this.options.jsonOptions);
        }
        return {};
      },

      _getHeaderDate: function(date) {
        var options = this.options;
        if (options.getHeaderDate && $.isFunction(options.getHeaderDate)) {
          return options.getHeaderDate(date, this.element);
        }

        return utils.formatDate(date, options.dateFormat);
      },

      /*
       * Returns corrected date related to DST problem
       */
      _getDSTdayShift: function(date, shift) {
        var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0);
        var offset1 = start.getTimezoneOffset();
        var offset2 = date.getTimezoneOffset();
        if (offset1 === offset2) {
          return date;
        } else {
          shift = shift ? shift : 1;
          return new Date(date.getTime() - shift * (offset1 > offset2 ? -1 : 1) * (Math.max(offset1, offset2) - Math.min(offset1, offset2)) * 60000);
        }
      },

      _needDSTdayShift: function(date1, date2) {
        return date1.getTimezoneOffset() !== date2.getTimezoneOffset();
      }
    }; // end of widget function return
  })() //end of widget function closure execution
); // end of $.widget("ui.weekCalendar"...

  $.extend($.ui.weekCalendar, {
    version: '2.0-dev',
    updateLayoutOptions: {
      startOnFirstDayOfWeek: true,
      firstDayOfWeek: true,
      daysToShow: true,
      displayOddEven: true,
      timeFormat: true,
      dateFormat: true,
      useShortDayNames: true,
      businessHours: true,
      timeslotHeight: true,
      timeslotsPerHour: true,
      buttonText: true,
      height: true,
      textSize: true,
      users: true,
      showAsSeparateUsers: true,
      displayFreeBusys: true
    }
  });

  var MILLIS_IN_DAY = 86400000;
  var MILLIS_IN_WEEK = MILLIS_IN_DAY * 7;

  /* FREE BUSY MANAGERS */
  var FreeBusyProto = {
    getStart: function() {
      return this.getOption('start');
    },

    getEnd: function() {
      return this.getOption('end');
    },

    getOption: function() {
      if (!arguments.length) {
        return this.options;
      }

      if (typeof(this.options[arguments[0]]) !== 'undefined') {
        return this.options[arguments[0]];
      } else if (typeof(arguments[1]) !== 'undefined') {
        return arguments[1];
      }
      return null;
    },

    setOption: function(key, value) {
      if (arguments.length === 1) {
        $.extend(this.options, arguments[0]);
        return this;
      }
      this.options[key] = value;
      return this;
    },

    isWithin: function(dateTime) {
      return Math.floor(dateTime.getTime() / 1000) >= Math.floor(this.getStart().getTime() / 1000) && Math.floor(dateTime.getTime() / 1000) <= Math.floor(this.getEnd().getTime() / 1000);
    },

    isValid: function() {
      return this.getStart().getTime() < this.getEnd().getTime();
    }
  };

  /**
    * @constructor
    * Single user freebusy manager.
    */
  var FreeBusy = function(options) {
    this.options = $.extend({}, options || {});
  };
  $.extend(FreeBusy.prototype, FreeBusyProto);

  var FreeBusyManager = function(options) {
    this.options = $.extend({
        defaultFreeBusy: {}
      }, options || {});
    this.freeBusys = [];
    this.freeBusys.push(new FreeBusy($.extend({
      start: this.getStart(),
      end: this.getEnd()
    }, this.options.defaultFreeBusy)));
  };

  $.extend(FreeBusyManager.prototype, FreeBusyProto, {
    /**
      * Return matching freeBusys.
      * if you do not pass any argument, returns all freebusys.
      * if you only pass a start date, only matchinf freebusy will be returned.
      * if you pass 2 arguments, then all freebusys available within the time period will be returned
      * @param {Date} start [optionnal] if you do not pass end date, will return the freeBusy within which this date falls.
      * @param {Date} end [optionnal] the date where to stop the search.
      * @return {Array} an array of FreeBusy matching arguments.
      */
    getFreeBusys: function() {
      var freeBusy = [];
      var start = arguments[0], end = arguments[1];

      switch (arguments.length) {
      case 0:
        return this.freeBusys;
      case 1:
        if (!this.isWithin(start)) {
          return freeBusy;
        }
        $.each(this.freeBusys, function() {
          if (this.isWithin(start)) {
            freeBusy.push(this);
          }
          if (Math.floor(this.getEnd().getTime() / 1000) > Math.floor(start.getTime() / 1000)) {
            return false;
          }
        });
        return freeBusy;
      default:
        // We assume only 2 first args are revealants
        var tmpFreeBusy = new FreeBusy({start: start, end: end});
        if (end.getTime() < start.getTime() || this.getStart().getTime() > end.getTime() || this.getEnd().getTime() < start.getTime()) {
          return freeBusy;
        }
        $.each(this.freeBusys, function() {
          if (this.getStart().getTime() >= end.getTime()) {
            return false;
          }

          var _f;
          if (tmpFreeBusy.isWithin(this.getStart()) && tmpFreeBusy.isWithin(this.getEnd())) {
            freeBusy.push(this);
          } else if (this.isWithin(tmpFreeBusy.getStart()) && this.isWithin(tmpFreeBusy.getEnd())) {
            _f = new FreeBusy(this.getOption());
            _f.setOption('end', tmpFreeBusy.getEnd());
            _f.setOption('start', tmpFreeBusy.getStart());
            freeBusy.push(_f);
          } else if (this.isWithin(tmpFreeBusy.getStart()) && this.getStart().getTime() < start.getTime()) {
            _f = new FreeBusy(this.getOption());
            _f.setOption('start', tmpFreeBusy.getStart());
            freeBusy.push(_f);
          } else if (this.isWithin(tmpFreeBusy.getEnd()) && this.getEnd().getTime() > end.getTime()) {
            _f = new FreeBusy(this.getOption());
            _f.setOption('end', tmpFreeBusy.getEnd());
            freeBusy.push(_f);
          }
        });
        return freeBusy;
      }
    },

    insertFreeBusy: function(freeBusy) {
      // First, if inserted freebusy is bigger than manager
      freeBusy = new FreeBusy(freeBusy.getOption());
      if (freeBusy.getStart().getTime() < this.getStart().getTime()) {
        freeBusy.setOption('start', this.getStart());
      }

      if (freeBusy.getEnd().getTime() > this.getEnd().getTime()) {
        freeBusy.setOption('end', this.getEnd());
      }

      var start = freeBusy.getStart(), end = freeBusy.getEnd();
      var startIndex = 0, endIndex = this.freeBusys.length - 1;
      var newFreeBusys = [];
      var pushNewFreeBusy = function(_f) {
        if (_f.isValid()) {
          newFreeBusys.push(_f);
        }
      };

      $.each(this.freeBusys, function(index) {
        // Within the loop, we have following vars:
        // curFreeBusyItem: the current iteration freeBusy, part of manager freeBusys list
        // start: the insterted freeBusy start
        // end: the inserted freebusy end
        var curFreeBusyItem = this;
        var _f1, _f2, _f3;
        if (curFreeBusyItem.isWithin(start) && curFreeBusyItem.isWithin(end)) {
          /*
            We are in case where inserted freebusy fits in curFreeBusyItem:
            curFreeBusyItem:    *-----------------------------*
            freeBusy:                *-------------*
            obviously, start and end indexes are this item.
          */
          startIndex = index;
          endIndex = index;
          if (start.getTime() === curFreeBusyItem.getStart().getTime() && end.getTime() === curFreeBusyItem.getEnd().getTime()) {
            /*
              In this case, inserted freebusy is exactly curFreeBusyItem:
              curFreeBusyItem:    *-----------------------------*
              freeBusy:            *-----------------------------*

              just replace curFreeBusyItem with freeBusy.
            */
            _f1 = new FreeBusy(freeBusy.getOption());
            pushNewFreeBusy(_f1);
          } else if (start.getTime() === curFreeBusyItem.getStart().getTime()) {
            /*
              In this case inserted freebusy starts with curFreeBusyItem:
              curFreeBusyItem:    *-----------------------------*
              freeBusy:            *--------------*

              just replace curFreeBusyItem with freeBusy AND the rest.
            */
            _f1 = new FreeBusy(freeBusy.getOption());
            _f2 = new FreeBusy(curFreeBusyItem.getOption());
            _f2.setOption('start', end);
            pushNewFreeBusy(_f1);
            pushNewFreeBusy(_f2);
          } else if (end.getTime() === curFreeBusyItem.getEnd().getTime()) {
            /*
              In this case inserted freebusy ends with curFreeBusyItem:
              curFreeBusyItem:    *-----------------------------*
              freeBusy:                          *--------------*

              just replace curFreeBusyItem with before part AND freeBusy.
            */
            _f1 = new FreeBusy(curFreeBusyItem.getOption());
            _f1.setOption('end', start);
            _f2 = new FreeBusy(freeBusy.getOption());
            pushNewFreeBusy(_f1);
            pushNewFreeBusy(_f2);
          } else {
            /*
              In this case inserted freebusy is within curFreeBusyItem:
              curFreeBusyItem:    *-----------------------------*
              freeBusy:                    *--------------*

              just replace curFreeBusyItem with before part AND freeBusy AND the rest.
            */
            _f1 = new FreeBusy(curFreeBusyItem.getOption());
            _f2 = new FreeBusy(freeBusy.getOption());
            _f3 = new FreeBusy(curFreeBusyItem.getOption());
            _f1.setOption('end', start);
            _f3.setOption('start', end);
            pushNewFreeBusy(_f1);
            pushNewFreeBusy(_f2);
            pushNewFreeBusy(_f3);
          }
          return false;
        } else if (curFreeBusyItem.isWithin(start) && curFreeBusyItem.getEnd().getTime() !== start.getTime()) {
          /*
            In this case, inserted freebusy starts within curFreeBusyItem:
            curFreeBusyItem:    *----------*
            freeBusy:                *-------------------*

            set start index AND insert before part, we'll insert freebusy later
          */
          if (curFreeBusyItem.getStart().getTime() !== start.getTime()) {
            _f1 = new FreeBusy(curFreeBusyItem.getOption());
            _f1.setOption('end', start);
            pushNewFreeBusy(_f1);
          }
          startIndex = index;
        } else if (curFreeBusyItem.isWithin(end) && curFreeBusyItem.getStart().getTime() !== end.getTime()) {
          /*
            In this case, inserted freebusy starts within curFreeBusyItem:
            curFreeBusyItem:                  *----------*
            freeBusy:            *-------------------*

            set end index AND insert freebusy AND insert after part if needed
          */
          pushNewFreeBusy(new FreeBusy(freeBusy.getOption()));
          if (end.getTime() < curFreeBusyItem.getEnd().getTime()) {
            _f1 = new FreeBusy(curFreeBusyItem.getOption());
            _f1.setOption('start', end);
            pushNewFreeBusy(_f1);
          }
          endIndex = index;
          return false;
        }
      });

      // Now compute arguments
      var tmpFB = this.freeBusys;
      this.freeBusys = [];

      if (startIndex) {
        this.freeBusys = this.freeBusys.concat(tmpFB.slice(0, startIndex));
      }
      this.freeBusys = this.freeBusys.concat(newFreeBusys);
      if (endIndex < tmpFB.length) {
        this.freeBusys = this.freeBusys.concat(tmpFB.slice(endIndex + 1));
      }
      /* if(start.getDate() == 1){
      console.info('insert from '+freeBusy.getStart() +' to '+freeBusy.getEnd());
        console.log('index from '+ startIndex + ' to ' + endIndex);
        var str = [];
        $.each(tmpFB, function(i){str.push(i + ": " + this.getStart().getHours() + ' > ' + this.getEnd().getHours() + ' ' + (this.getOption('free') ? 'free' : 'busy'))});
        console.log(str.join('\n'));

        console.log('insert');
        var str = [];
        $.each(newFreeBusys, function(i){str.push(this.getStart().getHours() + ' > ' + this.getEnd().getHours())});
        console.log(str.join(', '));

        console.log('results');
        var str = [];
        $.each(this.freeBusys, function(i){str.push(i + ": " + this.getStart().getHours() + ' > ' + this.getEnd().getHours()  + ' ' + (this.getOption('free') ? 'free' :'busy'))});
        console.log(str.join('\n'));
      }*/
      return this;
    }
  });
  
  
})(jQuery);