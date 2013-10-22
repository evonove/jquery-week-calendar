/*
 * jQuery.weekCalendar
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

(function ($) {
    'use strict';

    $.widget('ui.weekCalendar', (function () {
        var _currentAjaxCall, _hourLineTimeout,
            utils = TimelyUi.utils,
            compat = TimelyUi.compat,
            MILLIS_IN_DAY = 86400000,
            MILLIS_IN_WEEK = MILLIS_IN_DAY * 7;

        return {
            options: {
                lastEventId: 42,
                date: new Date(),
                timeFormat: 'HH:mm',
                dateFormat: 'dddd DD MMMM',
                alertFadeOutInterval: 3000,
                alwaysDisplayTimeMinutes: true,
                daysToShow: 1,
                minBodyHeight: 300,
                firstDayOfWeek: function (calendar) {
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
                allowCalEventOverlap: true,
                overlapEventsSeparate: true,
                totalEventsWidthPercentInOneColumn: 100,
                readOnly: false,
                allowEventCreation: true,
                hourLine: true,
                modalTemplate: '/template/modal.html',
                modalSearchTemplate: '/template/modal-search.html',
                popoverTemplate: '/template/popover.html',
                deletable: function (calEvent, element) {
                    return true;
                },
                draggable: function (calEvent, element) {
                    return (!compat.isMobile && !compat.isTablet && calEvent.assignees.length === 1);
                },
                resizable: function (calEvent, element) {
                    return (!compat.isMobile && !compat.isTablet && calEvent.assignees.length === 1);
                },
                eventRender: function (calEvent, $event) {
                    if (calEvent.end.getTime() < new Date().getTime()) {
                        $event.css('backgroundColor', '#aaa');
                        $event.find('.wc-time').css({
                            backgroundColor: '#999',
                            border: '1px solid #888'
                        });
                    }
                },
                eventAfterRender: function (calEvent, element) {
                    return element;
                },
                eventRefresh: function (calEvent, element) {
                    return element;
                },

                /* Javascript events callbacks */

                // If true, a drag or resize events is currently happening
                eventAction: false,
                eventDrag: function (calEvent, element) {
                    var options = TimelyUi.calendar.options;

                    options.eventAction = true;
                    utils.disableIScrolls();
                },
                eventDrop: function (newCalEvent, oldCalEvent, element) {
                    var calendar = TimelyUi.calendar,
                        options = calendar.options,
                        maxColumnNumber = TimelyUi.maxColumnNumber;

                    utils.enableIScroll(0);
                    if (maxColumnNumber <= calendar.options.loadedUsers.length) {
                        utils.enableIScroll(1);
                        utils.enableIScroll(2);
                    }

                    // Persist new changes
                    var result = calendar.onSave(newCalEvent, oldCalEvent);
                    options.eventAction = false;

                    return result;
                },
                eventResizeStart: function () {
                    TimelyUi.calendar.options.eventAction = true;
                },
                eventResizeEnd: function (calEvent, element) {
                    TimelyUi.calendar.onSave(calEvent);
                    TimelyUi.calendar.options.eventAction = false;
                },
                eventNew: function (calEvent, element, calendar, upEvent) {
                    if (!compat.isMobile && !compat.isTablet) {
                        // Show popover
                        var _popoverPosition = $(element).offset().top < 247 ? 'bottom' : 'top';
                        TimelyUi.calendar.showPopoverForm(calEvent, element, _popoverPosition);
                    } else {
                        // Show modal in mobile
                        TimelyUi.calendar.showModalForm(calEvent);
                    }
                    return true;
                },
                eventClick: function (calEvent, element, calendar, clickEvent) {
                    TimelyUi.calendar.showModalForm(calEvent);
                    return true;
                },
                eventMouseover: function (calEvent, $event) {
                },
                eventMouseout: function (calEvent, $event) {
                },
                eventMousedownNewEvent: function (calEvent, $event) {
                    var options = TimelyUi.calendar.options;

                    options.eventAction = true;
                    utils.disableIScrolls();
                },
                eventMouseupNewEvent: function (calEvent, $event) {
                    var options = TimelyUi.calendar.options;

                    utils.enableIScroll(0);
                    if (TimelyUi.maxColumnNumber <= options.loadedUsers.length) {
                        utils.enableIScroll(1);
                        utils.enableIScroll(2);
                    }
                    options.eventAction = false;
                },
                eventDelete: function (calEvent, element, calendar, clickEvent) {
                },

                /* Generic callbacks */
                calendarBeforeLoad: function (calendar) {
                },
                calendarAfterLoad: function (calendar) {
                },
                noEvents: function () {
                },
                eventHeader: function (calEvent, calendar) {
                    var options = calendar.weekCalendar('option'),
                        oneHour = 3600000;

                    // Display time with title
                    if (calEvent.end.getTime() - calEvent.start.getTime() <= (oneHour / options.timeslotsPerHour)) {
                        return utils.formatDate(calEvent.start, options.timeFormat) + ': ' + calEvent.title;
                    } else {
                        return utils.formatDate(calEvent.start, options.timeFormat) + options.timeSeparator + utils.formatDate(calEvent.end, options.timeFormat);
                    }
                },
                eventBody: function (calEvent, calendar) {
                    return calEvent.assignees.length === 1 ? calEvent.title : '<i class="icon-group"></i> ' + calEvent.title;
                },
                userVisibilityChanged: function () {
                },

                /*** Users configuration ***/

                /**
                 * Used to quickly grab current user informations
                 */
                currentUser: {
                    "id": 1,
                    "username": "evonove"
                },

                currentUserOrganizations: [],

                // Available users for calendar
                loadedUsers: [],

                // Visible users
                users: [],

                // IDs of removed users
                removedUserIds: [],

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
                getUserId: function (user, index, calendar) {
                    return user.id;
                },
                /**
                 * Callback used to read user name from a user object.
                 * @param {Object} user the user to retrieve the name from.
                 * @param {number} index the user index from user list.
                 * @param {jQuery} calendar the calendar object.
                 * @return {String} the label which is not more length than selected characters.
                 */
                getUserName: function (user) {
                    var userLabel = user.last_name && user.first_name ? "{0} {1}.".format(user.first_name, user.last_name[0]) : user.first_name || user.last_name || user.username;
                    return userLabel.trunc(15);
                },
                /**
                 * Callback used to read organization name from a organization object.
                 * @param {Object} organization the organization to retrieve the name from.
                 * @param {number} index the user index from user list.
                 * @param {jQuery} calendar the calendar object.
                 * @return {String} the user name.
                 */
                getOrganizationName: function (organization, index, calendar) {
                    return organization.name;
                },
                /**
                 * Reads the id(s) of user(s) for who the event should be displayed.
                 * @param {Object} calEvent the calEvent to read informations from.
                 * @param {jQuery} calendar the calendar object.
                 * @return {number|String|Array} the user id(s) to appened events for.
                 */
                getEventUserId: function (calEvent, calendar) {
                    return calEvent.assignees;
                },

                /*** Other options ***/

                /**
                 * True means start on first day of week, false means starts on
                 * startDate.
                 * @param {jQuery} calendar the calendar object.
                 * @type {Function|bool}
                 */
                startOnFirstDayOfWeek: function (calendar) {
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
            _create: function () {
                var self = this;
                self._computeOptions();
                self._addClassesWidget();
                self._loadModalForm();
                if (compat.isMobile || compat.isTablet) {
                    // Load modal form for search
                    self._loadModalSearch();
                }
                self._loadPopoverForm();
                self._renderCalendar();
                self._loadCalEvents();
                self._loadAlertMessage();
                self._setupEventDelegation();

                window.onresize = function (e) {
                    if (typeof e.originalEvent === 'undefined') {
                        // Get widget status according to active media query and reset iScroll
                        TimelyUi._widgetStatus = TimelyUi.utils.mediaQueryCheck();
                        TimelyUi.maxColumnNumber = TimelyUi.columnsToShow = TimelyUi._widgetStatus.columns;

                        TimelyUi.utils._resetIScrolls();
                    }
                };
            },

            /********************
             * Public functions *
             ********************/
            /*
             * set readOnly and allowEventCreation options.
             */
            setReadOnly: function (value) {
                this.options.readOnly = value;
                this.options.allowEventCreation = !value;
            },
            /**
             * Return if widget is in read only mode
             */
            getWidgetStatus: function () {
                return this.options.readOnly;
            },
            /*
             * Refresh the events for the currently displayed week.
             */
            refresh: function (onlyPersistedItem) {
                this._loadCalEvents(this.element.data('startDate'), onlyPersistedItem);
            },

            /*
             * Clear all events currently loaded into the calendar
             */
            clear: function () {
                this._clearCalendar();
            },

            /*
             * Go to this week
             */
            today: function () {
                this._clearCalendar();
                this._loadCalEvents(new Date());
            },

            /*
             * Go to the previous week relative to the currently displayed week
             */
            prevWeek: function () {
                // Minus more than 1 day to be sure we're in previous week - account for daylight savings or other anomolies
                var newDate = new Date(this.element.data('startDate').getTime() - (MILLIS_IN_WEEK / 6));
                this._clearCalendar();
                this._loadCalEvents(newDate);
            },

            /*
             * Go to the next week relative to the currently displayed week
             */
            nextWeek: function () {
                //add 8 days to be sure of being in prev week - allows for daylight savings or other anomolies
                var newDate = new Date(this.element.data('startDate').getTime() + MILLIS_IN_WEEK + MILLIS_IN_DAY);
                this._clearCalendar();
                this._loadCalEvents(newDate);
            },

            /*
             * Reload the calendar to whatever week the date passed in falls on.
             */
            gotoWeek: function (date) {
                this._clearCalendar();
                this._loadCalEvents(date);
            },

            /*
             * Reload the calendar to whatever week the date passed in falls on.
             */
            gotoDate: function (date) {
                this._clearCalendar();
                this._loadCalEvents(date);
            },

            /*
             * Change the number of days to show
             */
            setDaysToShow: function (daysToShow) {
                var self = this;
                var hour = self._getCurrentScrollHour();
                self.options.daysToShow = daysToShow;
                $(self.element).html('');
                self._renderCalendar();
                self._loadCalEvents();
                self._scrollToHour(hour, false);
            },

            /*
             * Create a popover attached to an element
             */
            showPopoverForm: function (calEvent, element, popoverPosition) {
                var calendar = TimelyUi.calendar,
                    popover = TimelyUi.popover;

                // Remove existing popover and last unsaved event
                if (typeof popover.instance !== 'undefined') {
                    calendar.removeLastUnsavedEvent();
                    popover.close();
                }

                calendar.options.unsavedEvents.push(element);

                popover.options.calEvent = calEvent;
                popover.options.placement = popoverPosition;
                popover.attachTo(element);

                // Save on submit
                $('.js-form-popover').on('submit', function(e) {
                    e.preventDefault();
                    TimelyUi.popover.save();
                });
            },

            /*
             * Show modal form to create/edit event details
             */
            showModalForm: function (calEvent) {
                var modal = TimelyUi.modal;

                modal.instance = $('#ajax-modal').modal({ show: false }).data('modal');
                modal.instance.options.calEvent = calEvent;
                modal.instance.$element.modal('show');
            },

            /*** Persistence provider ***/
            getLastEventId: function () {
                return this.options.lastEventId;
            },

            /**
             * Save new event if this action is granted
             * @param {Object} newCalEvent to persist
             * @param {Object} oldCalEvent to re-create in case of errors
             * @returns {Boolean} true | false for success or fail
             */
            onSave: function (newCalEvent, oldCalEvent) {
                if (!newCalEvent.id) {
                    var data = this.options.data;
                    this.options.lastEventId += 1;
                    data.push(newCalEvent);
                }
                this.updateEvent(newCalEvent);
                return true;
            },

            onDelete: function (calEventToRemove) {
                var data = this.options.data;

                data.splice($.inArray(calEventToRemove, data), 1);
                this.removeEvent(calEventToRemove.id);
            },

            /**
             * Search function. You can override this from other framework to do a real search.
             * @param param query search param
             */
            onSearch: function (param) {
                console.log('Search query: ' + param);
            },

            /*
             * Remove an event based on it's id
             */
            removeEvent: function (eventId) {
                var self = this,
                    _event;

                self.element.find('.wc-cal-event').each(function () {
                    _event = $(this).data('calEvent');
                    if (_event.id === eventId) {
                        $(this).remove();

                        // Stop searching if it's just a single event
                        if (_event.assignees.length <= 1) {
                            return false;
                        }
                    }
                });

                // This could be more efficient rather than running on all days regardless...
                self.element.find('.wc-day-column-inner').each(function () {
                    self._adjustOverlappingEvents($(this));
                });
            },

            /*
             * Removes any events that have been added but not yet saved (have no id).
             * This is useful to call after adding a freshly saved new event.
             */
            removeUnsavedEvents: function () {
                var self = this;

                self.element.find('.wc-new-cal-event').each(function () {
                    $(this).remove();
                });

                // This could be more efficient rather than running on all days regardless...
                self.element.find('.wc-day-column-inner').each(function () {
                    self._adjustOverlappingEvents($(this));
                });
            },

            /*
             * Removes last inserted event that doesn't have any id
             * This is useful to remove the event during quick insert mode with popover.
             */
            removeLastUnsavedEvent: function () {
                var self = this,
                    lastUnsavedEvent = self.options.unsavedEvents.pop();

                if (typeof lastUnsavedEvent !== 'undefined') {
                    lastUnsavedEvent.remove();
                }
            },

            /*
             * Update an event in the calendar. If the event exists it refreshes
             * it's rendering. If it's a new event that does not exist in the calendar
             * it will be added.
             */
            updateEvent: function (calEvent) {
                this._updateEventInCalendar(calEvent);
            },

            /*
             * Returns an array of timeslot start and end times based on
             * the configured grid of the calendar. Returns in both date and
             * formatted time based on the 'timeFormat' config option.
             */
            getTimeslotTimes: function (date) {
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

            serializeEvents: function () {
                var self = this;
                var calEvents = [];

                self.element.find('.wc-cal-event').each(function () {
                    calEvents.push($(this).data('calEvent'));
                });
                return calEvents;
            },

            next: function () {
                if (this._startOnFirstDayOfWeek()) {
                    return this.nextWeek();
                }
                var newDate = new Date(this.element.data('startDate').getTime());
                newDate.setDate(newDate.getDate() + this.options.daysToShow);

                this._clearCalendar();
                this._loadCalEvents(newDate);
            },

            prev: function () {
                if (!this._startOnFirstDayOfWeek()) {
                    var newDate = new Date(this.element.data('startDate').getTime());
                    newDate.setDate(newDate.getDate() - this.options.daysToShow);

                    this._clearCalendar();
                    this._loadCalEvents(newDate);
                } else {
                    return this.prevWeek();
                }
            },

            getCurrentFirstDay: function () {
                return this._dateFirstDayOfWeek(this.options.date || new Date());
            },

            getCurrentLastDay: function () {
                return this._addDays(this.getCurrentFirstDay(), this.options.daysToShow - 1);
            },

            getUsernameById: function (id) {
                var self = TimelyUi.calendar,
                    foundItem = utils._findById(self.options.loadedUsers, id);

                return foundItem ? foundItem.username : "";
            },

            _getOrganizationById: function (id) {
                var self = TimelyUi.calendar,
                    foundItem = utils._findById(self.options.currentUserOrganizations, id);

                return foundItem ? foundItem : {};
            },

            /**********************
             * Private functions *
             *********************/

            _setOption: function (key, value) {
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

                    var currentEvents = self.element.find('.wc-cal-event').map(function () {
                        return $(this).data('calEvent');
                    });

                    var newOptions = {};
                    newOptions[key] = value;
                    self._renderEvents({events: currentEvents, options: newOptions}, self.element.find('.wc-day-column-inner'));
                }
            },

            /* Compute dynamic options based on other config values */
            _computeOptions: function () {
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
             * Configure calendar interaction events that are able to use event
             * delegation for greater efficiency
             */
            _setupEventDelegation: function () {
                var self = this,
                    options = self.options;

                var clickEvent = function (event) {
                    var $target = $(event.target);

                    // Click is disabled
                    if ($target.data('preventClick')) {
                        return;
                    }

                    var $calEvent = $target.hasClass('wc-cal-event') ? $target : $target.parents('.wc-cal-event');
                    if (!$calEvent.length || !$calEvent.data('calEvent')) {
                        return;
                    }

                    if (options.allowEventDelete && $target.hasClass('wc-cal-event-delete')) {
                        options.eventDelete($calEvent.data('calEvent'), $calEvent, self.element, event);
                    } else {
                        options.eventClick($calEvent.data('calEvent'), $calEvent, self.element, event);
                    }
                };
                var $element = $('.js-calendar-wrapper');
                compat.on($element, compat.events.click, clickEvent);
            },

            /*
             * Check if a ui draggable or resizable is currently being dragged or resized
             */
            _isDraggingOrResizing: function ($target) {
                return $target.hasClass('ui-draggable-dragging') ||
                    $target.hasClass('ui-resizable-resizing');
            },

            /*
             * Set global classes to calendar widget
             */
            _addClassesWidget: function () {
                var $calendarContainer = this.element;
                $calendarContainer
                    .addClass('row-fluid')
                    .addClass('fill')
                    .addClass('wc-calendar');
            },

            /*
             * Append modal form to calendar div loading dynamically all contents
             */
            _loadModalForm: function () {
                var calendarContainer = this.element,
                    modal = TimelyUi.modal,
                    htmlNode = $('<div id="ajax-modal" class="modal modal-event hide"/>');

                calendarContainer.append(htmlNode);

                // Add fade effect on desktops
                if (!compat.isMobile && !compat.isTablet) {
                    htmlNode.addClass('fade');
                }

                var modalNode = $('#ajax-modal');
                modalNode.load(this.options.modalTemplate, function() {
                    modal.init(modalNode);
                });
            },

            /*
             * Append modal search to calendar if it's a mobile device
             */
            _loadModalSearch: function () {
                var calendarContainer = this.element,
                    _html = "";

                _html += '<div id="modal-search" class="modal modal-event hide fade">';
                _html += '<div class="modal-header">';
                _html += '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
                _html += '<h5>Search:</h5>';
                _html += '</div>';

                _html += '<div class="modal-body">';
                _html += '<form class="navbar-search span12">';
                _html += '<input class="js-search search-query span12" type="text" placeholder="Search..." />';
                _html += '</form>';
                _html += '</div>';

                _html += '<div class="modal-footer">';
                _html += '<button type="button" class="btn" data-dismiss="modal" aria-hidden="true">Close</button>';
                _html += '</div>';

                calendarContainer.append(_html);
            },

            /*
             * Append popover form to calendar div loading dynamically all contents
             */
            _loadPopoverForm: function () {
                var popover = TimelyUi.popover;

                $.get(this.options.popoverTemplate, function(template) {
                    popover.options.content = template;
                });
            },

            /*
             * Append alert popup
             */
            _loadAlertMessage: function () {
                var calendarContainer = this.element;

                calendarContainer.append('<div class="js-alert alert fade"></div>');
            },

            /*
             * Render the main calendar layout
             */
            _renderCalendar: function () {
                var $calendarContainer, $weekDayColumns;
                var self = this;
                var options = this.options;

                $calendarContainer = self.element;

                // Render the different parts of calendar
                self._renderCalendarButtons($calendarContainer);
                self._renderCalendarHeader($calendarContainer);
                self._renderCalendarBody($calendarContainer);

                $weekDayColumns = $calendarContainer.find('.wc-day-column-inner');
                $weekDayColumns.each(function (i, val) {
                    if (!options.readOnly) {
                        self._addDroppableToWeekDay($(this));
                        if (options.allowEventCreation) {
                            self._setupEventCreationForWeekDay($(this));
                        }
                    }
                });
            },

            _parseDate: function (value) {
                return !!value ? new Date(value) : new Date();
            },

            /*
             * Render the nav buttons on top of the calendar
             */
            _renderCalendarButtons: function ($calendarContainer) {
                var self = this,
                    options = this.options,
                    calendarNavHtml = '',
                    headerHtml = '',
                    settingsHtml = '',
                    $rightMenuContainer,
                    _searchForm,
                    _searchBar,
                    $container;

                if (options.showHeader) {
                    // Append date selector used to change current date
                    $calendarContainer.append('<input type="date" class="js-date-selected datepicker" />');

                    // Rendering header with calendar controls
                    headerHtml += '<header></header>';
                    var $headerHtml = $(headerHtml);
                    $headerHtml.appendTo($calendarContainer);
                    if (options.buttons) {
                        calendarNavHtml += '<div class="wc-nav">';
                        calendarNavHtml += '<div class="pull-left">';
                        calendarNavHtml += '<div class="btn-group">';
                        calendarNavHtml += '<a class="btn btn-primary wc-prev visible-desktop"><i class="icon-double-angle-left"></i></a>';
                        calendarNavHtml += '<a class="js-date-selector btn btn-primary visible-desktop"><i class="icon-calendar"></i></a>';
                        calendarNavHtml += '<a class="btn btn-primary wc-next visible-desktop"><i class="icon-double-angle-right"></i></a>';
                        calendarNavHtml += '</div>';
                        calendarNavHtml += '<div class="btn-group">';
                        calendarNavHtml += '<a class="js-date-selector btn btn-primary hidden-desktop"><i class="icon-calendar"></i></a>';
                        calendarNavHtml += '</div>';
                        calendarNavHtml += '<div class="btn-group">';
                        calendarNavHtml += '<a class="btn btn-primary wc-today hidden-desktop">' + options.buttonText.today + '</a>';
                        calendarNavHtml += '</div>';
                        calendarNavHtml += '</div>';
                        calendarNavHtml += '<div class="js-right-menu pull-right">';
                        calendarNavHtml += '</div>';
                        calendarNavHtml += '</div>';
                        $(calendarNavHtml).appendTo($headerHtml);

                        $rightMenuContainer = $calendarContainer.find('.js-right-menu');

                        // Settings menu
                        settingsHtml += '<div class="btn-group btn-margin pull-right">';
                        settingsHtml += '<a href="/settings/" class="btn btn-inverse visible-desktop"><i class="icon-cogs"></i> Settings</a>';
                        settingsHtml += '</div>';
                        $(settingsHtml).appendTo($rightMenuContainer);

                        if (compat.isMobile || compat.isTablet) {
                            // Add date chooser controller
                            var $selected = $('.js-date-selected');
                            $('.js-date-selector').on('click', function() {
                                if (compat.isSafariWebKit) {
                                    $selected.focus();
                                } else {
                                    $selected.click();
                                }
                            });

                            $selected.on('change', function(event) {
                                self.gotoDate(self._parseDate($(this).val()));
                            });

                            // Modal button
                            var _searchButton = $('<button class="btn btn-inverse"><i class="icon-search"></i></button>');
                            _searchBar = $('.js-search');
                            _searchButton.on('click', function(e) {
                                $('#modal-search').modal({show: true, backdrop: false});
                            });
                            _searchButton.appendTo($rightMenuContainer);
                        } else {
                            // Add date chooser controller
                            var $picker = $('.js-date-selector').pickadate(),
                                picker = $picker.pickadate('picker');

                            picker.on('set', function() {
                                self.gotoDate(self._parseDate(picker.get('select').obj));
                            });

                            // Create search widget
                            calendarNavHtml = '<form class="navbar-search">';
                            calendarNavHtml += '<input class="js-search search-query search-event" type="text" placeholder="Search..." />';
                            calendarNavHtml += '</form>';
                            $(calendarNavHtml).appendTo($rightMenuContainer);

                            // Add search animation
                            _searchBar = $('.js-search');
                            _searchBar
                                .focus(function () {
                                    $(this).animate({ width: "150px"}, 'slow');
                                })
                                .blur(function () {
                                    $(this).animate({ width: "80px"}, 'slow');
                                    $(this).val('');
                                });
                        }

                        // Fire onSearch function on submit
                        _searchForm = $('.navbar-search');
                        _searchForm.on('submit', function (e) {
                            var text = _searchBar.val();

                            e.preventDefault();
                            if (text) {
                                if (!compat.isMobile || !compat.isTablet) {
                                    $('#modal-search').modal('hide');
                                }
                                self.onSearch(_searchBar.val());
                            }
                        });

                        // Rendering users filter if they are more than 1
                        if (options.loadedUsers && options.loadedUsers.length > 1) {
                            var userNavHtml = '';

                            userNavHtml += '<div class="js-user btn-group btn-margin pull-right">';
                            userNavHtml += '<a class="btn btn-inverse dropdown-toggle" data-toggle="dropdown" href="#">';
                            userNavHtml += '<i class="icon-group"></i> <span class="hidden-phone">Users</span> ';
                            userNavHtml += '<span class="caret"></span>';
                            userNavHtml += '</a>';
                            userNavHtml += '<ul class="js-user-list avatar-list dropdown-menu">';
                            userNavHtml += '</ul>';
                            userNavHtml += '</div>';
                            $(userNavHtml).appendTo($rightMenuContainer);

                            // Add user's filter
                            $container = $calendarContainer.find('.js-user-list');
                            $.each(options.loadedUsers, function (index, user) {
                                var _userAvatar = user.avatar_url || 'https://secure.gravatar.com/avatar/d41d8cd98f00b204e9800998ecf8427e?d=mm&s=30';
                                var _userButton = '';

                                _userButton += '<li class="item enabled">';
                                _userButton += '<a href="#" class="js-select-user" data-user-id="' + user.id + '">';
                                _userButton += '<span class="placeholder-avatar">';
                                _userButton += '<img class="placeholder-img" height="30" width="30" src="' + _userAvatar + '" alt="' + options.getUserName(user) + '">';
                                _userButton += '</span>';
                                _userButton += '<span>' + options.getUserName(user) + ' (<span>' + user.username + '</span>)</span> <span class="icon-sm icon-ok"></span>';
                                _userButton += '</a>';
                                _userButton += '</li>';

                                $container.append($(_userButton));
                            });

                            // Add filter event on selection
                            $container.find('.js-select-user').click(function(e) {
                                var $this = $(this);
                                var $parent = $this.parent();
                                var _userId = $this.data('user-id');
                                var _userIsVisible = $parent.hasClass('enabled');

                                utils.toggleUser(_userId, _userIsVisible);
                                _userIsVisible ? $parent.removeClass('enabled') : $parent.addClass('enabled');

                                return false;
                            });
                        }

                        // Rendering organizations filter if they are more than 1 and have extended profile
                        if (options.currentUserOrganizations && options.currentUserOrganizations.length > 1) {
                            var orgNavHtml = '';

                            orgNavHtml += '<div class="btn-group btn-margin pull-right">';
                            orgNavHtml += '<a class="btn btn-inverse dropdown-toggle" data-toggle="dropdown" href="#">';
                            orgNavHtml += '<i class="icon-building"></i> <span class="hidden-phone">Teams</span> ';
                            orgNavHtml += '<span class="caret"></span>';
                            orgNavHtml += '</a>';
                            orgNavHtml += '<ul class="js-organization-list avatar-list dropdown-menu">';
                            orgNavHtml += '</ul>';
                            orgNavHtml += '</div>';
                            $(orgNavHtml).appendTo($rightMenuContainer);

                            $container = $calendarContainer.find('.js-organization-list');
                            $.each(options.currentUserOrganizations, function (index, organization) {
                                var _organizationAvatar = organization.logo_url || 'https://secure.gravatar.com/avatar/d41d8cd98f00b204e9800998ecf8427e?d=mm&s=30';
                                var _organizationButton = '';

                                _organizationButton += '<li class="item enabled">';
                                _organizationButton += '<a href="#" class="js-select-organization" data-organization-id="' + organization.id + '">';
                                _organizationButton += '<span class="placeholder-avatar">';
                                _organizationButton += '<img class="placeholder-img" height="30" width="30" src="' + _organizationAvatar + '" alt="' + organization.name + '">';
                                _organizationButton += '</span>';
                                _organizationButton += '<span>' + organization.name + '</span>';
                                _organizationButton += '</a>';
                                _organizationButton += '</li>';
                                $container.append(_organizationButton);
                            });
                            $container.find('.js-select-organization').click(function (event) {
                                var organizationId = $(this).data('organization-id');
                                utils.showAllUsers(organizationId);
                            });
                        }

                        // Add listener to buttons
                        $calendarContainer.find('.wc-today').click(function () {
                            self.today();
                            return false;
                        });

                        $calendarContainer.find('.wc-prev').click(function () {
                            self.element.weekCalendar('prev');
                            return false;
                        });

                        $calendarContainer.find('.wc-next').click(function () {
                            self.element.weekCalendar('next');
                            return false;
                        });

                        // Add buttons to switch display
                        if (this.options.switchDisplay && $.isPlainObject(this.options.switchDisplay)) {
                            $container = $calendarContainer.find('.wc-display');
                            $.each(this.options.switchDisplay, function (label, option) {
                                var _input = $('<button class="btn">' + label + '</button>');
                                _input.val(option);
                                if (parseInt(self.options.daysToShow, 10) === parseInt(option, 10)) {
                                    _input.attr('checked', 'checked');
                                }

                                $container.append(_input);
                            });
                            $container.find('button').click(function () {
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
                }
            },

            /**
             * Show an alert message with Twitter Bootstrap alert (fade in and fade out)
             * @param {String} text you want to show
             * @param {String} fadeOut if error should fade out after some milliseconds
             */
            showErrorMessage: function (text, fadeOut, fullsize) {
                var _self = this;
                _self.showMessage(text, 'alert-error', fadeOut, fullsize)
            },

            showSuccessMessage: function (text, fadeOut, fullsize) {
                var _self = this;
                _self.showMessage(text, 'alert-success', fadeOut, fullsize)
            },

            showMessage: function (text, type, fadeOut, fullsize) {
                var _self = this,
                    _calendarContainer = _self.element,
                    _alert = $('.js-alert').clone();

                _alert.html(text);
                _alert.removeClass('js-alert');
                _alert.addClass(type + ' alert-top');
                if (!fullsize) {
                    _alert.addClass('alert-min');
                }
                _calendarContainer.append(_alert);

                // Show alert
                _alert.addClass('in');

                // Remove after some delay
                if (fadeOut) {
                    setTimeout(function () {
                        _self.closeMessage();
                    }, _self.options.alertFadeOutInterval);
                }
            },

            closeMessage: function () {
                $('.alert-top').alert('close');
            },

            /*
             * Render the calendar header, including date and user header
             */
            _renderCalendarHeader: function ($calendarContainer) {
                var self = this,
                    options = self.options,
                    showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length,
                    calendarHeaderHtml,
                    userHeaderHtml,
                    rowspan = '', colspan = '',
                    $headerHtml = $('header');

                if (showAsSeparatedUser) {
                    rowspan = ' rowspan=\"2\"';
                    colspan = ' colspan=\"' + options.users.length + '\" ';
                }

                // Header containers
                calendarHeaderHtml = '<div class=\"wc-header calendar-header\">';

                // Days row
                calendarHeaderHtml += '<table ><thead><tr>';
                for (var i = 1; i <= options.daysToShow; i++) {
                    calendarHeaderHtml += '<th class=\"js-animation-day wc-day-column-header wc-day-' + i + '\"' + colspan + '></th>';
                }
                calendarHeaderHtml += '</thead></table>';

                // Users row
                if (showAsSeparatedUser) {
                    calendarHeaderHtml += '<table id="calendar-header-wrapper" class="wrapper wc-calendar-header-wrapper"><thead class="wc-scroller-width wc-head-scroller-placeholder">';
                    calendarHeaderHtml += '<tr><th class=\"wc-time-column-header\"></th>';
                    var uLength = options.loadedUsers.length, _headerClass = '';

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
                        userHeaderHtml = '<th class=\"' + _headerClass + ' wc-user-header wc-day-' + i + ' wc-user-' + self._getUserIdFromIndex(j) + '\">';
                        userHeaderHtml += self._getUserName(j);
                        userHeaderHtml += '</th>';

                        calendarHeaderHtml += userHeaderHtml;
                    }
                    calendarHeaderHtml += '</tr>';
                }
                calendarHeaderHtml += '</thead></table>';

                // Avoid go left/right buttons to scroll users if they fit on window
                if (options.loadedUsers.length > TimelyUi.columnsToShow) {
                    calendarHeaderHtml += '<div class=\"wc-go-left\"><button type="button" class="btn btn-inverse"><i class="icon-chevron-left"></i></button></div>';
                    calendarHeaderHtml += '<div class=\"wc-go-right\"><button type="button" class="btn btn-inverse"><i class="icon-chevron-right"></i></button></div>';
                }

                calendarHeaderHtml += '</div>';
                $(calendarHeaderHtml).appendTo($headerHtml);

                // Append fade effect on mobile devices
                if (compat.isMobile || compat.isTablet) {
                    $(".js-animation-day").on("transitionend webkitTransitionEnd mozTransitionEnd oTransitionEnd", function(){
                        var $self = $(this),
                            _fadeClass,
                            _newDay;

                        if ($self.hasClass('fade-left') === true)  {
                            _fadeClass = 'fade-in-left';
                            _newDay = 'next';
                        } else if ($self.hasClass('fade-right') === true)  {
                            _fadeClass = 'fade-in-right';
                            _newDay = 'prev';
                        }

                        $self.removeClass('fade-left fade-right');
                        $self.addClass(_fadeClass);
                        self.element.weekCalendar(_newDay);
                    });
                }

                // Enable iScroll with buttons click
                compat.on($('.wc-go-right'), compat.events.click, utils._goRight);
                compat.on($('.wc-go-left'), compat.events.click, utils._goLeft);
            },

            /*
             * Render the calendar body.
             * Calendar body is composed of several distinct parts.
             * Each part is displayed in a separated row to ease rendering.
             */
            _renderCalendarBody: function ($calendarContainer) {
                var self = this;
                var options = this.options;
                var showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length;
                var $calendarBody, $calendarTableTbody;

                // Create the structure
                $calendarBody = '';

                $calendarBody += '<div id="scrollbar-wrapper" class=\"js-calendar-wrapper row-fluid wc-scrollbar-wrapper\">';
                $calendarBody += '<div class=\"wc-scroller-height\">';

                $calendarBody += '<div id="calendar-body-wrapper" class=\"wc-scrollable-grid wc-calendar-body-wrapper\">';
                $calendarBody += '<div class=\"wc-scroller-width wc-body-scroller-placeholder\">';

                $calendarBody += '<table class=\"wc-time-slots\" >';
                $calendarBody += '<tbody>';
                $calendarBody += '</tbody>';
                $calendarBody += '</table>';

                $calendarBody += '</div>';
                $calendarBody += '<div id="day-hours" class="wc-day-hours">' + self._renderDayHours() + '</div>';
                $calendarBody += '</div>';

                $calendarBody += '</div>';
                $calendarBody += '</div>';
                $calendarBody = $($calendarBody);
                $calendarTableTbody = $calendarBody.find('tbody');

                self._renderCalendarBodyTimeSlots($calendarTableTbody);
                self._renderCalendarBodyOddEven($calendarTableTbody);
                self._renderCalendarBodyEvents($calendarTableTbody);

                $calendarBody.appendTo($calendarContainer);

                // Add swipe capabilities (with HammerJs) only if the swipe is quickly
                if (compat.isMobile || compat.isTablet) {
                    compat.on($('.js-calendar-wrapper'), 'swipe', function(event) {
                        // Require velocity condition for iPad
                        var _swipe = compat.isSafariWebKit && compat.isTablet && event.gesture.velocityX < 1.2 ? false : true;
                        if (_swipe) {
                            var $animationDay = $('.js-animation-day');
                            $animationDay.removeClass('fade-in-left fade-in-right');
                            if (event.gesture.direction === 'left') {
                                $animationDay.addClass('fade-left');
                            } else if (event.gesture.direction === 'right') {
                                $animationDay.addClass('fade-right');
                            }
                        }
                    });
                }

                // Set the column height
                $calendarContainer.find('.wc-full-height-column').height(options.timeslotHeight * options.timeslotsPerDay);

                // Set the timeslot height
                $calendarContainer.find('.wc-time-slot').height(options.timeslotHeight - 1);

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
                    for (var i = 0, uLength = options.loadedUsers.length; i < uLength; i++) {
                        $calendarContainer.find('.wc-user-' + self._getUserIdFromIndex(i))
                            .data('wcUser', options.getUserName(options.loadedUsers[i]))
                            .data('wcUserIndex', i)
                            .data('wcUserId', self._getUserIdFromIndex(i));
                    }
                }
            },

            /*
             * Render the timeslots separation
             */
            _renderCalendarBodyTimeSlots: function ($calendarTableTbody) {
                var options = this.options;
                var renderRow, i, j;
                var showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length;
                var start = (options.businessHours.limitDisplay ? options.businessHours.start : 0);
                var end = (options.businessHours.limitDisplay ? options.businessHours.end : 24);
                var rowspan = 1;

                // Calculate the rowspan
                if (options.displayOddEven) {
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
            _renderCalendarBodyOddEven: function ($calendarTableTbody) {
                if (this.options.displayOddEven) {
                    var self = this,
                        options = self.options,
                        renderRow = '<tr class=\"wc-grid-row-oddeven\">',
                        showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length,
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
                            var uLength = options.loadedUsers.length;
                            for (var j = 0; j < uLength; j++) {
                                oddEven = (oddEven === 'odd' ? 'even' : 'odd');
                                renderRow += '<td class=\"wc-day-column day-' + i + ' wc-user-' + self._getUserIdFromIndex(j) + '\">';
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

            _renderDayHours: function () {

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
            _renderCalendarBodyEvents: function ($calendarTableTbody) {
                var self = this,
                    options = this.options,
                    renderRow,
                    showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length;

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
                        var uLength = options.loadedUsers.length;
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
            _setupEventCreationForWeekDay: function ($weekDay) {

                var self = this,
                    options = self.options;

                self.lastValidTagert = {};
                self.upEventCreation = function (event) {
                    compat.off($('html'), compat.events.up, self.upEventCreation);

                    var $target = self.lastValidTagert;
                    if ($target.closest) {
                        var $weekDay = $target.closest('.wc-day-column-inner'),
                            $newEvent = $weekDay.find('.wc-new-cal-event-creating');

                        if ($newEvent.length) {
                            var createdFromSingleClick = !$newEvent.hasClass('ui-resizable-resizing');

                            // If even created from a single click only, default height
                            if (createdFromSingleClick) {
                                $newEvent.css({height: options.timeslotHeight * options.defaultEventLength}).show();
                            }
                            var top = parseInt($newEvent.css('top'), 10);
                            var eventDuration = self._getEventDurationFromPositionedEventElement($weekDay, $newEvent, top);

                            var showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length;
                            var userId = showAsSeparatedUser ? $weekDay.data('wcUserId') : self._getUserIdFromIndex(0);
                            var organization = options.currentUser.id === userId ? null : utils.chooseOrganization(options.currentUser.organizations, self._getUserFromId(userId).organizations);
                            var newCalEvent = {title: options.newEventText, start: eventDuration.start, end: eventDuration.end, organization: organization};

                            newCalEvent = self._setEventUser(newCalEvent, userId);

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
                                options.eventNew(newCalEvent, $renderedCalEvent, self.element, event);
                                self.processed = true;
                            }
                            else {
                                $($renderedCalEvent).remove();
                            }
                        }
                        options.eventMouseupNewEvent();
                    }
                };

                self.move = function (event) {
                    var $newEvent = self.move.$newEvent,
                        columnOffset = self.move.columnOffset,
                        topPosition = self.move.topPosition,
                        pageY = 0,
                        touch,
                        _now = new Date();

                    // Patch to avoid too many mouse or touch move events
                    if (_now - self.move._date < 100) {
                        return;
                    }
                    self.move_date = _now;

                    $newEvent.show();
                    $newEvent.addClass('ui-resizable-resizing');

                    if (event.touches !== undefined) {
                        touch = event.touches[0];
                        pageY = touch.pageY;
                    } else if (event.gesture !== undefined && event.gesture.touches !== undefined) {
                        touch = event.gesture.touches[0];
                        pageY = touch.pageY;
                    } else if (event.originalEvent !== undefined && event.originalEvent.targetTouches !== undefined) {
                        touch = event.originalEvent.targetTouches[0];
                        pageY = touch.pageY;
                    } else {
                        pageY = event.pageY;
                    }

                    var height = Math.round(pageY - columnOffset - topPosition),
                        remainder = height % options.timeslotHeight;

                    if (remainder < 0) {
                        var useHeight = height - remainder;
                        $newEvent.css('height', useHeight < options.timeslotHeight ? options.timeslotHeight : useHeight);
                    } else {
                        $newEvent.css('height', height + (options.timeslotHeight - remainder));
                    }
                };

                self.removeEventAddClass = function ($event) {
                    var $newEvent = self.removeEventAddClass.$newEvent,
                        $target = self.removeEventAddClass.$target;

                    compat.off($target, compat.events.move, self.move);
                    compat.off($target, compat.events.up, self.removeEventAddClass);
                    $newEvent.addClass('ui-corner-all');
                };

                self.getTopPosition = function (event) {
                    var columnOffset = $(event.target).offset().top,
                        clickY = 0,
                        touch;
                    if (event.touches !== undefined) {
                        touch = event.touches[0];
                        clickY = touch.pageY - columnOffset;
                    } else if (event.gesture !== undefined && event.gesture.touches !== undefined) {
                        touch = event.gesture.touches[0];
                        clickY = touch.pageY - columnOffset;
                    } else if (event.originalEvent !== undefined && event.originalEvent.targetTouches !== undefined) {
                        touch = event.originalEvent.targetTouches[0];
                        clickY = touch.pageY - columnOffset;
                    } else {
                        clickY = event.pageY - columnOffset;
                    }

                    var clickYRounded = (clickY - (clickY % options.timeslotHeight)) / options.timeslotHeight,
                        topPosition = clickYRounded * options.timeslotHeight;
                    return topPosition;
                };

                self.downEventCreation = function (event) {
                    if (!options.allowEventCreation) {
                        return false;
                    }

                    var $target = $(event.target);
                    if ($target.hasClass('wc-day-column-inner')) {
                        var $newEvent = $('<div class=\"wc-cal-event wc-new-cal-event wc-new-cal-event-creating\"></div>');
                        $newEvent.css({lineHeight: (options.timeslotHeight - 2) + 'px', fontSize: (options.timeslotHeight / 2) + 'px'});
                        $target.append($newEvent);

                        var columnOffset = $target.offset().top;
                        var topPosition = self.getTopPosition(event);

                        // TODO: this is a Monkey Patch
                        self.move.columnOffset = columnOffset;
                        self.move.topPosition = topPosition;
                        self.move.$newEvent = $newEvent;
                        self.move._date = new Date();
                        self.removeEventAddClass.$target = $target;
                        self.removeEventAddClass.$newEvent = $newEvent;

                        $newEvent.css({top: topPosition});

                        if (!options.preventDragOnEventCreation) {
                            compat.on($target, compat.events.move, self.move);
                            compat.on($target, compat.events.up, self.removeEventAddClass);
                        }
                        self.lastValidTagert = $target;
                        options.eventMousedownNewEvent();
                        compat.on($('html'), compat.events.up, self.upEventCreation);
                    }
                };
                compat.on($weekDay, compat.events.hold, self.downEventCreation);
            },

            /*
             * Load calendar events for the week based on the date provided
             */
            _loadCalEvents: function (dateWithinWeek, onlyPersistedItem) {
                var self = this,
                    options = this.options,
                    date, weekStartDate, weekEndDate, $weekDayColumns;


                if (dateWithinWeek && dateWithinWeek.getFullYear() === options.date.getFullYear() && dateWithinWeek.getMonth() === options.date.getMonth() && dateWithinWeek.getDate() === options.date.getDate()) {
                    date = this._fixMinMaxDate(options.date);
                } else {
                    date = this._fixMinMaxDate(dateWithinWeek || options.date);
                }


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
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            if (errorThrown !== 'abort' && XMLHttpRequest.status !== 0) {
                                alert('unable to get data, error:' + textStatus);
                            }
                        },

                        success: function (data) {
                            self._renderEvents(data, $weekDayColumns, onlyPersistedItem);
                        },

                        complete: function () {
                            _currentAjaxCall = null;
                            if (options.loading) {
                                options.loading(false);
                            }
                        }
                    });
                } else if ($.isFunction(options.data)) {
                    options.data(weekStartDate, weekEndDate, function (data) {
                        self._renderEvents(data, $weekDayColumns, onlyPersistedItem);
                    });
                } else if (options.data) {
                    self._renderEvents(options.data, $weekDayColumns, onlyPersistedItem);
                }
            },

            /*
             * Draws a thin line which indicates the current time.
             */
            _drawCurrentHourLine: function () {
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
                var lineWidth = $('.wc-scrollable-grid', this.element).width() + 3;

                $('.wc-day-column').not('.state-default').append(
                    $('<div>', {
                        'class': 'wc-hourline',
                        style: 'top: ' + positionTop + 'px; width: ' + lineWidth + 'px'
                    })
                );
            },

            /*
             * Update the display of each day column header based on the calendar week
             */
            _updateDayColumnHeader: function ($weekDayColumns) {
                var self = this,
                    options = self.options,
                    currentDay = self._cloneDate(self.element.data('startDate')),
                    showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length,
                    todayClass = 'state-active';

                self.element.find('.wc-header th.wc-day-column-header').each(function (i, val) {
                    $(this).html(self._getHeaderDate(currentDay));
                    if (self._isToday(currentDay)) {
                        $(this).addClass(todayClass);
                    } else {
                        $(this).removeClass(todayClass);
                    }
                });

                $weekDayColumns.each(function (i, val) {
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
                });

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
            },

            /*
             * Gets the calendar raw title.
             */
            _getCalendarTitle: function () {
                if ($.isFunction(this.options.title)) {
                    return this.options.title(this.options.daysToShow);
                }

                return this.options.title || '';
            },

            /*
             * Render the events into the calendar
             */
            _renderEvents: function (data, $weekDayColumns, onlyPersistedItem) {
                var self = this;
                var options = this.options;
                var eventsToRender;

                if (data.options) {
                    var updateLayout = false;
                    // Update options
                    $.each(data.options, function (key, value) {
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
                        self._scrollToHour(hour, false);
                    }
                }

                this._clearCalendar(onlyPersistedItem);

                if ($.isArray(data)) {
                    eventsToRender = self._cleanEvents(data);
                } else if (data.events) {
                    eventsToRender = self._cleanEvents(data.events);
                }

                // Render a multi day event as various event
                $.each(eventsToRender, function (i, calEvent) {
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

                        // End of this virtual calEvent is set to the end of the day
                        calEvent.end.setFullYear(start.getFullYear());
                        calEvent.end.setDate(start.getDate());
                        calEvent.end.setMonth(start.getMonth());
                        calEvent.end.setHours(maxHour, 0, 0);

                        if (($weekDay = self._findWeekDayForEvent(calEvent, $weekDayColumns))) {
                            self._renderEvent(calEvent, $weekDay);
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

                        $weekDay = self._findWeekDayForEvent(calEvent, $weekDayColumns);
                        if (typeof $weekDay !== 'undefined') {
                            self._renderEvent(calEvent, $weekDay);
                        }
                    }

                    // Put back the initial start date
                    calEvent.start = initialStart;
                });

                $weekDayColumns.each(function () {
                    self._adjustOverlappingEvents($(this));
                });

                options.calendarAfterLoad(self.element);

                if (_hourLineTimeout) {
                    clearInterval(_hourLineTimeout);
                }

                if (options.hourLine) {
                    self._drawCurrentHourLine();

                    _hourLineTimeout = setInterval(function () {
                        self._drawCurrentHourLine();
                    }, 60 * 1000);
                }
            },

            /*
             * Render a specific event into the day provided. Assumes correct
             * day for calEvent date
             */
            _renderEvent: function (calEvent, $weekDay) {
                var self = this,
                    options = this.options,
                    eventClass, eventHtml, $calEventList, $modifiedEvent;

                if (calEvent.start.getTime() > calEvent.end.getTime()) {
                    // Don't render a negative height
                    return;
                }

                eventClass = calEvent.id ? 'wc-cal-event' : 'wc-cal-event wc-new-cal-event';
                eventHtml = '<div class=\"' + eventClass + ' ui-corner-all\">';
                eventHtml += '<div class=\"wc-time ui-corner-top\"></div>';
                eventHtml += '<div class=\"wc-title\"></div></div>';

                $weekDay.each(function () {
                    var $calEvent = $(eventHtml);
                    $modifiedEvent = options.eventRender(calEvent, $calEvent);
                    $calEvent = $modifiedEvent ? $modifiedEvent.appendTo($(this)) : $calEvent.appendTo($(this));
                    $calEvent.css({lineHeight: (options.textSize + 2) + 'px', fontSize: options.textSize + 'px'});

                    self._refreshEventDetails(calEvent, $calEvent);
                    self._positionEvent($(this), $calEvent);

                    // Add to event list
                    $calEventList = $calEventList ? $calEventList.add($calEvent) : $calEvent;
                });

                $calEventList.show();

                if (calEvent.id && (!options.readOnly && options.resizable(calEvent, $calEventList))) {
                    self._addResizableToCalEvent(calEvent, $calEventList, $weekDay);
                }

                if (calEvent.id && (!options.readOnly && options.draggable(calEvent, $calEventList))) {
                    self._addDraggableToCalEvent(calEvent, $calEventList);
                }

                options.eventAfterRender(calEvent, $calEventList);
                return $calEventList;
            },

            addEvent: function () {
                return this._renderEvent.apply(this, arguments);
            },

            _adjustOverlappingEvents: function ($weekDay) {
                var self = this;
                if (self.options.allowCalEventOverlap) {
                    var groupsList = self._groupOverlappingEventElements($weekDay);
                    $.each(groupsList, function () {
                        var curGroups = this;
                        $.each(curGroups, function (groupIndex) {
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
                            $.each(curGroup, function () {
                                // Bring mouseovered event to the front
                                if (!self.options.overlapEventsSeparate) {
                                    $(this).bind('mouseover.z-index', function () {
                                        var $elem = $(this);
                                        $.each(curGroup, function () {
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
            _groupOverlappingEventElements: function ($weekDay) {
                var $events = $weekDay.find('.wc-cal-event:visible'),
                    lastEndTime = new Date(0, 0, 0),
                    groups = [],
                    curGroups = [],
                    $curEvent,
                    sortedEvents = $events.sort(function (a, b) {
                        if (typeof $(a).data('calEvent') === 'undefined') {
                            return;
                        }
                        return $(a).data('calEvent').start.getTime() - $(b).data('calEvent').start.getTime();
                    });

                $.each(sortedEvents, function () {
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
                    if (typeof $curEvent.data('calEvent') !== 'undefined' && (lastEndTime.getTime() < $curEvent.data('calEvent').end.getTime())) {
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
            _findWeekDayForEvent: function (calEvent, $weekDayColumns) {
                var $weekDay;
                var options = this.options;
                var showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length;
                var user_ids = this._getEventUserId(calEvent);

                if (!$.isArray(user_ids)) {
                    user_ids = [user_ids];
                }

                $weekDayColumns.each(function (index, curDay) {
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
            _updateEventInCalendar: function (calEvent) {
                var self = this;
                self._cleanEvent(calEvent);

                /* TODO: avoid this useless loop. Use selector to find event */
                if (typeof calEvent.id !== 'undefined') {
                    self.element.find('.wc-cal-event').each(function () {
                        if ($(this).data('calEvent').id === calEvent.id || $(this).hasClass('wc-new-cal-event')) {
                            $(this).remove();
                            return false;
                        }
                    });
                }

                var $weekDays = self._findWeekDayForEvent(calEvent, self.element.find('.wc-grid-row-events .wc-day-column-inner'));
                if ($weekDays) {
                    $weekDays.each(function (index, weekDay) {
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
            _positionEvent: function ($weekDay, $calEvent) {
                var options = this.options;
                var calEvent = $calEvent.data('calEvent');
                var pxPerMillis = $weekDay.height() / options.millisToDisplay;
                var firstHourDisplayed = options.businessHours.limitDisplay ? options.businessHours.start : 0;
                var startMillis = this._getDSTdayShift(calEvent.start).getTime() - this._getDSTdayShift(new Date(calEvent.start.getFullYear(), calEvent.start.getMonth(), calEvent.start.getDate(), firstHourDisplayed)).getTime();
                var eventMillis = this._getDSTdayShift(calEvent.end).getTime() - this._getDSTdayShift(calEvent.start).getTime();
                var pxTop = pxPerMillis * startMillis;
                var pxHeight = pxPerMillis * eventMillis;
                $calEvent.css({top: pxTop, height: pxHeight || (pxPerMillis * 3600000 / options.timeslotsPerHour)});
            },

            /*
             * Determine the actual start and end times of a calevent based on it's
             * relative position within the weekday column and the starting hour of the
             * displayed calendar.
             */
            _getEventDurationFromPositionedEventElement: function ($weekDay, $calEvent, top) {
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
            _adjustForEventCollisions: function ($weekDay, $calEvent, newCalEvent, oldCalEvent, maintainEventDuration) {
                var options = this.options;

                if (options.allowCalEventOverlap) {
                    return;
                }

                var adjustedStart, adjustedEnd;
                var self = this;

                $weekDay.find('.wc-cal-event').not($calEvent).each(function () {
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
            _addDraggableToCalEvent: function (calEvent, $calEvent) {
                var options = this.options,
                    functionStart = function (event, ui) {
                        options.tic = 0;
                        options.dragTicTime = new Date().getTime();
                        var $calEvent = ui.draggable || ui.helper;
                        options.eventDrag(calEvent, $calEvent);
                    };

                options.dragTicTime = undefined;
                $calEvent.draggable({
                    handle: (compat.isMobile || compat.isTablet ) ? '' : '.wc-time',
                    containment: 'div.wc-time-slots',
                    snap: '.wc-day-column-inner',
                    snapMode: 'inner',
                    snapTolerance: options.timeslotHeight - 1,
                    revert: 'invalid',
                    opacity: 0.5,
                    grid: [$calEvent.outerWidth() + 1, options.timeslotHeight],
                    create: function (event, ui) {
                        if (compat.isMobile || compat.isTablet) {
                            compat.on($(this.querySelector('.wc-time')), compat.events.hold, (function (ui) {
                                return function (event) {
                                    var myEvent = jQuery.Event('dragstart');
                                    functionStart(myEvent, ui);
                                };
                            }(ui)));
                        }
                    },

                    start: functionStart,
                    drag: function (event, ui) {
                        var options = TimelyUi.calendar.options,
                            maxColumnNumber = TimelyUi.maxColumnNumber;

                        if (event.clientX + ui.position.left > window.screen.availWidth - 100 && new Date().getTime() > options.dragTicTime + 600 && maxColumnNumber < options.loadedUsers.length) {
                            options.dragTicTime = new Date().getTime();
                            if (TimelyUi.columnsToShow !== 1) {
                                $('.wc-go-right').click();
                                $('html').mouseup();
                            }
                            return false;
                        }
                        if (ui.offset.left < 50 && event.clientX + ui.position.left < 100 && new Date().getTime() > options.dragTicTime + 600 && maxColumnNumber < options.loadedUsers.length) {
                            options.dragTicTime = new Date().getTime();
                            if (TimelyUi.columnsToShow !== 1) {
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
            _addDroppableToWeekDay: function ($weekDay) {
                var self = this,
                    options = self.options;

                $weekDay.droppable({
                    accept: '.wc-cal-event',
                    drop: function (event, ui) {
                        var $calEvent = ui.draggable;
                        var top = Math.round(parseInt(ui.position.top, 10));
                        var eventDuration = self._getEventDurationFromPositionedEventElement($weekDay, $calEvent, top);
                        var calEvent = $calEvent.data('calEvent');
                        var newCalEvent = $.extend(true, {}, calEvent, {start: eventDuration.start, end: eventDuration.end});
                        var showAsSeparatedUser = options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length;
                        if (showAsSeparatedUser) {
                            var newUserId = $weekDay.data('wcUserId');
                            var userIdList = self._getEventUserId(calEvent);
                            var oldUserId = $(ui.draggable.parents('.wc-day-column-inner').get(0)).data('wcUserId');

                            if ($.inArray(newUserId, userIdList) === -1) {
                                var _index = $.inArray(oldUserId, userIdList);
                                userIdList.splice(_index, 1);

                                if ($.inArray(newUserId, userIdList) === -1) {
                                    userIdList.push(newUserId);
                                }
                            }
                            newCalEvent = self._setEventUser(newCalEvent, userIdList);
                        }
                        self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, calEvent, true);
                        var $weekDayColumns = self.element.find('.wc-day-column-inner');

                        // Trigger drop callback
                        var saveStatus = options.eventDrop(newCalEvent, calEvent, $calEvent);
                        if (saveStatus) {
                            self._renderEvent(newCalEvent, self._findWeekDayForEvent(newCalEvent, $weekDayColumns));
                            $calEvent.hide();
                            $calEvent.data('preventClick', true);

                            var $weekDayOld = self._findWeekDayForEvent($calEvent.data('calEvent'), self.element.find('.wc-time-slots .wc-day-column-inner'));

                            if ($weekDayOld.data('startDate') !== $weekDay.data('startDate')) {
                                self._adjustOverlappingEvents($weekDayOld);
                            }

                            self._adjustOverlappingEvents($weekDay);
                            $calEvent.remove();
                        }
                    }
                });
            },

            /*
             * Add resizable capabilities to a calEvent
             */
            _addResizableToCalEvent: function (calEvent, $calEvent, $weekDay) {
                var self = this,
                    options = self.options;

                $calEvent.resizable({
                    containment: (compat.isMobile || compat.isTablet) ? 'parent' : $weekDay,
                    grid: options.timeslotHeight,
                    handles: (compat.isMobile || compat.isTablet) ? '' : 's',
                    minHeight: options.timeslotHeight,
                    start: function (event, ui) {
                        TimelyUi.utils.disableIScrolls();
                        options.eventResizeStart();
                    },
                    stop: function (event, ui) {
                        TimelyUi.utils.enableIScrolls();
                        var $calEvent = ui.element;
                        var newEnd = new Date($calEvent.data('calEvent').start.getTime() + Math.max(1, Math.round(ui.size.height / options.timeslotHeight)) * options.millisPerTimeslot);
                        if (self._needDSTdayShift($calEvent.data('calEvent').start, newEnd)) {
                            newEnd = self._getDSTdayShift(newEnd, -1);
                        }

                        var newCalEvent = $.extend(true, {}, calEvent, {start: calEvent.start, end: newEnd});
                        self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, calEvent);

                        // Trigger resize callback
                        options.eventResizeEnd(newCalEvent, calEvent, $calEvent);
                        self._refreshEventDetails(newCalEvent, $calEvent);
                        self._positionEvent($weekDay, $calEvent);
                        self._adjustOverlappingEvents($weekDay);
                    }
                });

                $('.ui-resizable-handle', $calEvent).html('===');
                $('.ui-resizable-handle').addClass('wc-resizable');
            },

            /*
             * Refresh the displayed details of a calEvent in the calendar
             */
            _refreshEventDetails: function (calEvent, $calEvent) {
                var suffix = '';
                if (!this.options.readOnly && this.options.allowEventDelete && this.options.deletable(calEvent, $calEvent)) {
                    suffix = '<div class="wc-cal-event-delete ui-icon ui-icon-close"></div>';
                }
                var wcTime = $calEvent.find('.wc-time');
                wcTime.html(this.options.eventHeader(calEvent, this.element) + suffix);
                $calEvent.find('.wc-title').html(this.options.eventBody(calEvent, this.element));
                if (calEvent.organization !== undefined && calEvent.organization !== null) {
                    var bgClass = 'wc-bg-' + calEvent.organization % 6;
                    $calEvent.addClass(bgClass);
                }
                $calEvent.data('calEvent', calEvent);
                this.options.eventRefresh(calEvent, $calEvent);
            },

            /*
             * Clear all cal events from the calendar
             */
            _clearCalendar: function (onlyPersistedItem) {
                var eventsToClear = [];

                if (onlyPersistedItem) {
                    eventsToClear = this.element.find('.wc-cal-event').not('.wc-new-cal-event');
                } else {
                    eventsToClear = this.element.find('.wc-day-column-inner div');
                }

                eventsToClear.remove();
            },

            /*
             * Scroll the calendar to a specific hour
             */
            _scrollToHour: function (hour) {
                var self = this;
                var iscroll = TimelyUi.iScrollEls[0];
                var $scrollable = this.element.find('.wc-scroller-height');
                if (iscroll !== undefined) {
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
                    var targetOffset = ($target.offset().top < 1920) ? $target.offset().top : 1920;
                    var scroll = targetOffset - $scrollable.offset().top - $target.outerHeight();

                    // Avoid too much scrolling
                    var _scrollY = -scroll < iscroll.maxScrollY ? iscroll.maxScrollY : -scroll;
                    iscroll.scrollTo(0, _scrollY, 0);
                }
            },

            _24HourForIndex: function (index) {
                if (index === 0) {
                    return '00:00';
                } else if (index < 10) {
                    return '0' + index + ':00';
                } else {
                    return index + ':00';
                }
            },

            _amOrPm: function (hourOfDay) {
                return hourOfDay < 12 ? 'AM' : 'PM';
            },

            _isToday: function (date) {
                var clonedDate = this._cloneDate(date);
                this._clearTime(clonedDate);
                var today = new Date();
                this._clearTime(today);
                return today.getTime() === clonedDate.getTime();
            },

            /*
             * Clean events to ensure correct format
             */
            _cleanEvents: function (events) {
                var self = this;
                $.each(events, function (i, event) {
                    self._cleanEvent(event);
                });
                return events;
            },

            /*
             * Clean specific event
             */
            _cleanEvent: function (event) {
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
            _dateFirstDayOfWeek: function (date) {
                var self = this;
                var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                var adjustedDate = new Date(midnightCurrentDate);
                adjustedDate.setDate(adjustedDate.getDate() - self._getAdjustedDayIndex(midnightCurrentDate));

                return adjustedDate;
            },

            /*
             * Returns the date on the first millisecond of the last day of the week
             */
            _dateLastDayOfWeek: function (date) {
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
            _fixMinMaxDate: function (date) {
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
            _getAdjustedDayIndex: function (date) {
                if (!this._startOnFirstDayOfWeek()) {
                    return 0;
                }

                var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                var currentDayOfStandardWeek = midnightCurrentDate.getDay();
                var days = [0, 1, 2, 3, 4, 5, 6];
                this._rotate(days, this._firstDayOfWeek());
                return days[currentDayOfStandardWeek];
            },

            _firstDayOfWeek: function () {
                if ($.isFunction(this.options.firstDayOfWeek)) {
                    return this.options.firstDayOfWeek(this.element);
                }
                return this.options.firstDayOfWeek;
            },

            /*
             * Returns the date on the last millisecond of the week
             */
            _dateLastMilliOfWeek: function (date) {
                var lastDayOfWeek = this._dateLastDayOfWeek(date);
                lastDayOfWeek = this._cloneDate(lastDayOfWeek);
                lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 1);
                return lastDayOfWeek;
            },

            /*
             * Clear the time components of a date leaving the date
             * of the first milli of day
             */
            _clearTime: function (d) {
                d.setHours(0);
                d.setMinutes(0);
                d.setSeconds(0);
                d.setMilliseconds(0);
                return d;
            },

            /*
             * Add specific number of days to date
             */
            _addDays: function (d, n, keepTime) {
                d.setDate(d.getDate() + n);
                if (keepTime) {
                    return d;
                }
                return this._clearTime(d);
            },

            /*
             * Rotate an array by specified number of places.
             */
            _rotate: function (a /*array*/, p /* integer, positive integer rotate to the right, negative to the left... */) {
                var l = a.length;
                p = (Math.abs(p) >= l && (p %= l), p < 0 && (p += l), p);

                for (var i, x; p; p = (Math.ceil(l / p) - 1) * p - l + (l = p)) {
                    for (i = l; i > p; x = a[--i], a[i] = a[i - p], a[i - p] = x) {
                    }
                }
                return a;
            },

            _cloneDate: function (d) {
                return new Date(d.getTime());
            },

            /**
             * Return a Date instance for different representations.
             * @param {Object} date in any representations
             * @return {Date} The clean date object.
             */
            _cleanDate: function (date) {
                var utils = TimelyUi.utils;

                // If is a numeric timestamp written as String
                if (!isNaN(Number(date))) {
                    date = Number(date);
                }

                return utils.toDate(date);
            },

            /* User management functions */

            /*
             * Return the user name for header
             */
            _getUserName: function (index) {
                var self = this;
                var options = this.options;
                var user = options.loadedUsers[index];

                return $.isFunction(options.getUserName) ? options.getUserName(user, index, self.element) : user;
            },

            /*
             * Return the user id for given index
             */
            _getUserIdFromIndex: function (index) {
                var self = this;
                var options = this.options;

                return $.isFunction(options.getUserId) ? options.getUserId(options.loadedUsers[index], index, self.element) : index;
            },

            /*
             * Returns the associated user index for given ID
             */
            _getUserIndexFromId: function (id) {
                var self = this;
                var options = this.options;
                for (var i = 0; i < options.loadedUsers.length; i++) {
                    if (self._getUserIdFromIndex(i) === id) {
                        return i;
                    }
                }
                return 0;
            },

            /*
             * Returns user according to selected id
             */
            _getUserFromId: function (id) {
                var self = this;

                return self.options.loadedUsers[self._getUserIndexFromId(id)];
            },

            /*
             * Return the user ids for given calEvent.
             * default is calEvent.userId field.
             */
            _getEventUserId: function (calEvent) {
                var self = this;
                var options = this.options;
                if (options.showAsSeparateUsers && options.loadedUsers && options.loadedUsers.length) {
                    return $.extend(true, [], calEvent.assignees);
                }
                return [];
            },

            /*
             * Sets the event user id on given calEvent
             * Default is calEvent.userId field.
             */
            _setEventUser: function (calEvent, userId) {
                if ($.isArray(userId)) {
                    calEvent.assignees = userId;
                } else {
                    calEvent.assignees = [userId];
                }

                return calEvent;
            },

            /*
             * Sets the event organization id on given calEvent
             * Default is calEvent.organizationId field.
             */
            _setEventOrganization: function (calEvent, organizationId) {
                var self = this;

                calEvent.organizationId = organizationId;
                calEvent.organization = self._getOrganizationById(organizationId);
                return calEvent;
            },

            /* New options management */

            /*
             * Checks wether or not the calendar should be displayed starting on first day of week
             */
            _startOnFirstDayOfWeek: function () {
                return jQuery.isFunction(this.options.startOnFirstDayOfWeek) ? this.options.startOnFirstDayOfWeek(this.element) : this.options.startOnFirstDayOfWeek;
            },

            /*
             * Finds out the current scroll to apply it when changing the view
             */
            _getCurrentScrollHour: function () {
                var self = this;
                var options = this.options;
                var $scrollable = this.element.find('.wc-scrollable-grid');
                var scroll = $scrollable.scrollTop();
                if (self.options.businessHours.limitDisplay) {
                    scroll = scroll + options.businessHours.start * options.timeslotHeight * options.timeslotsPerHour;
                }
                return Math.round(scroll / (options.timeslotHeight * options.timeslotsPerHour)) + 1;
            },

            _getJsonOptions: function () {
                if ($.isFunction(this.options.jsonOptions)) {
                    return $.extend({}, this.options.jsonOptions(this.element));
                }
                if ($.isPlainObject(this.options.jsonOptions)) {
                    return $.extend({}, this.options.jsonOptions);
                }
                return {};
            },

            _getHeaderDate: function (date) {
                var options = this.options;
                if (options.getHeaderDate && $.isFunction(options.getHeaderDate)) {
                    return options.getHeaderDate(date, this.element);
                }

                return utils.formatDate(date, options.dateFormat);
            },

            /*
             * Returns corrected date related to DST problem
             */
            _getDSTdayShift: function (date, shift) {
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

            _needDSTdayShift: function (date1, date2) {
                return date1.getTimezoneOffset() !== date2.getTimezoneOffset();
            }
        };
    })());
})(jQuery);
