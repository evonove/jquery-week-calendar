(function (TimelyUi) {
    'use strict';
    TimelyUi.utils = TimelyUi.utils || {};

    /*************************
     * Javascript prototypes *
     ************************/

    String.prototype.format = String.prototype.f = function () {
        var s = this,
            i = arguments.length;

        while (i--) {
            s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
        }
        return s;
    };

    String.prototype.trunc = String.prototype.trunc || function (n) {
        return this.length > n ? this.substr(0, n - 1) + '...' : this;
    };

    /*****************
     * Generic utils *
     ****************/

    /**
     * Array.filter method is implemented in JavaScript 1.6, supported by most modern browsers.
     * If for supporting the old browser, I wrote my one.
     */
    TimelyUi.utils._filter = function (array, attrName, attrValue, likeQuery) {
        var endArray;

        if (!likeQuery) {
            likeQuery = false;
        }
        try {
            endArray = array.filter(function (el) {
                return (likeQuery) ? el[attrName] === attrValue : el[attrName] !== attrValue;
            });
            return endArray;
        } catch (err) {
            endArray = array;
            $.each(array, function (index, obj) {
                if (likeQuery) {
                    if (obj[attrName] !== attrValue) {
                        endArray.splice(index, 1);
                    }
                } else {
                    if (obj[attrName] === attrValue) {
                        endArray.splice(index, 1);
                    }
                }
            });
            return endArray;
        }
    };

    TimelyUi.utils._resetIScrolls = function (redim_, justHeader_) {
        var redim = (redim_ === undefined) ? true : redim_,
            justHeader = (justHeader_ === undefined) ? false : justHeader_;

        TimelyUi.dispelVodooMagic();

        if (redim) {
            $.each(TimelyUi.iScrollEls, function (key, val) {
                val.destroy();
            });
            TimelyUi.iScrollEls = {};
            TimelyUi.utils._resetHelperValues();
            TimelyUi.initIScrolls();
        }
        if (!redim && justHeader) {
            if (typeof TimelyUi.iScrollEls[2] === 'IScroll') {
                TimelyUi.iScrollEls[2].destroy();
                TimelyUi.iScrollEls[2] = {};
                TimelyUi.initIScrolls(justHeader);
                var iscroll = TimelyUi.iScrollEls[2];
                if (TimelyUi.utils.lastPos !== undefined) {
                    var pos = TimelyUi.utils.lastPos;
                    iscroll.scrollTo((pos.left + 45), 0, 0);
                }
            }
        }
        TimelyUi.boundIScrolls();
        if (redim) {
            TimelyUi.utils._redimColumnsWidth();
        }
        TimelyUi.vodooMagic();
        if (redim) {
            TimelyUi.calendar._scrollToHour(TimelyUi.calendar.options.date.getHours(), true);
        }

    };

    TimelyUi.utils._resetHelperValues = function () {
        var conf = TimelyUi.calendar.conf,
            loadedUsers = conf.loadedUsers;

        TimelyUi.current = 0;
        TimelyUi.currentUserId = loadedUsers[0].id;
        TimelyUi.maxColumnNumber = TimelyUi.columnsToShow = TimelyUi.maxColumnNumber || TimelyUi.calendar.conf.maxColumnNumber || 5;
    };

    /***************************
     * Sliding users by buttons *
     ****************************/
    TimelyUi.utils._goRight = function (e) {
        var utils = TimelyUi.utils,
            maxPointerIndex = utils.getMaxPointerIndex();
        utils.slidingUser(TimelyUi.iScrollEls, utils.slidingUserRight, maxPointerIndex);
        e.preventDefault();
        return false;
    };

    TimelyUi.utils._goLeft = function (e) {
        var utils = TimelyUi.utils,
            minPointerIndex = utils.getMinPointerIndex();
        utils.slidingUser(TimelyUi.iScrollEls, utils.slidingUserLeft, minPointerIndex);
        e.preventDefault();
        return false;
    };

    /**
     * Used by .wc-go-right click/.wc-go-left click event.
     */
    TimelyUi.utils._scrollToIfNeeded = function (iscroll, nextEl, pos, time, easing) {
        time = time === undefined || null || time === 'auto' ? Math.max(Math.abs(pos.left) * 2, Math.abs(pos.top) * 2) : time;

        if (iscroll.lastPos === undefined || iscroll.lastPos.left !== pos.left || $(nextEl).css('display') === 'none') {
            iscroll.lastPos = pos;
            iscroll.lastIndexPointer = iscroll.pointerIndex;
            iscroll.scrollTo(pos.left, pos.top, time);
        } else {
            iscroll.pointerIndex = iscroll.lastIndexPointer;
        }
    };

    /**
     * Used by .wc-go-right click/.wc-go-left click event.
     */
    TimelyUi.utils._posByEl = function (iscroll, el, offsetX, offsetY, pxOffsetX, pxOffsetY) {
        el = el.nodeType ? el : iscroll.scroller.querySelector(el);

        if (!el) {
            return;
        }
        var pos = TimelyUi.utils._offset(el);

        pos.left -= iscroll.wrapperOffset.left;
        pos.top -= iscroll.wrapperOffset.top;

        // if offsetX/Y are true we center the element to the screen
        if (offsetX === true) {
            offsetX = Math.round(el.offsetWidth / 2 - iscroll.wrapper.offsetWidth / 2);
        }
        if (offsetY === true) {
            offsetY = Math.round(el.offsetHeight / 2 - iscroll.wrapper.offsetHeight / 2);
        }

        pos.left -= offsetX || 0;
        pos.top -= offsetY || 0;

        pos.left -= pxOffsetX || 0;
        pos.top -= pxOffsetY || 0;

        pos.left = pos.left > 0 ? 0 : pos.left < iscroll.maxScrollX ? iscroll.maxScrollX : pos.left;
        pos.top = pos.top > 0 ? 0 : pos.top < iscroll.maxScrollY ? iscroll.maxScrollY : pos.top;

        return pos;
    };

    TimelyUi.utils._scrollBySelector = function (iscroll, selector) {
        var utils = TimelyUi.utils;
        var el0 = document.querySelector(selector);
        var pos0 = utils._posByEl(iscroll, el0, false, false, -45, 0);
        utils._scrollToIfNeeded(iscroll, el0, pos0, 1000);
    };

    /**
     * Slide user and column user-event clicking button on sides.
     * The controller refresh indexPointer in some cases:
     * - user hide one or more columns then slide right/left;
     * - user show one or more columns then slide.
     *
     * TODO: Write a better code
     */
    TimelyUi.utils._shiftIfNeeded = function (controller, pointerIndexLimit) {
        var conf = TimelyUi.calendar.conf,
            utils = TimelyUi.utils,
            loadedUsers = conf.loadedUsers,
            removedUserId,
            removedUserIds = conf.removedUserIds,
            removedUserIdsLength = removedUserIds.length,
            current = TimelyUi.current,
            currentUser = utils._filter(loadedUsers, 'id', TimelyUi.currentUserId, true)[0],
            next = 0;

        for (; controller.checkForShifting(current); current = controller.increment(current)) {
            if (currentUser.id === loadedUsers[current].id) {
                for (var j = 0; j < removedUserIdsLength; ++j) {
                    removedUserId = removedUserIds[j];
                    if (removedUserId === currentUser.id) {
                        next = controller.increment(current);
                        if (controller.checkForHidden(next, pointerIndexLimit)) {
                            TimelyUi.currentUserId = loadedUsers[next].id;
                            current = utils._shiftIfNeeded(controller, pointerIndexLimit);
                        }
                        return current;
                    }
                }
                break;
            }
        }
        return current;
    };

    TimelyUi.utils._slidingUserStrategy = function (strategy) {
        return {
            refreshIfNoSufficientColumns: function (current, pointerIndexLimit) {
                return strategy.refreshIfNoSufficientColumns(current, pointerIndexLimit);
            },
            increment: function (current) {
                return strategy.increment(current);
            },
            checkForHidden: function (next, pointerIndexLimit) {
                return strategy.checkForHidden(next, pointerIndexLimit);
            },
            checkForShifting: function (current) {
                return strategy.checkForShifting(current);
            }
        };
    };

    TimelyUi.utils.slidingUserRight = {
        refreshIfNoSufficientColumns: function (current, pointerIndexLimit) {
            var conf = TimelyUi.calendar.conf,
                loadedUsers = conf.loadedUsers;

            if (current >= pointerIndexLimit) {
                TimelyUi.current = pointerIndexLimit;
                TimelyUi.currentUserId = loadedUsers[pointerIndexLimit].id;
                return true;
            }
            return false;
        },
        increment: function (current) {
            return current + 1;
        },
        checkForHidden: function (next, pointerIndexLimit) {
            return (next <= pointerIndexLimit);
        },
        checkForShifting: function (current) {
            var conf = TimelyUi.calendar.conf,
                loadedUsers = conf.loadedUsers;
            return current < loadedUsers.length;
        }
    };

    TimelyUi.utils.slidingUserLeft = {
        refreshIfNoSufficientColumns: function (current, pointerIndexLimit) {
            var conf = TimelyUi.calendar.conf,
                loadedUsers = conf.loadedUsers;
            if (current <= pointerIndexLimit) {
                TimelyUi.current = pointerIndexLimit;
                TimelyUi.currentUserId = loadedUsers[pointerIndexLimit].id;
                return true;
            }
            return false;
        },
        increment: function (current) {
            return current - 1;
        },
        checkForHidden: function (next, pointerIndexLimit) {
            return (next >= pointerIndexLimit);
        },
        checkForShifting: function (current) {
            return current > 0;
        }
    };

    TimelyUi.utils.slidingUser = function (iScrolls, strategy, pointerIndexLimit) {
        var conf = TimelyUi.calendar.conf,
            utils = TimelyUi.utils,
            loadedUsers = conf.loadedUsers,
            removedUserId,
            removedUserIds = conf.removedUserIds,
            removedUserIdsLength = removedUserIds.length,
            controller = utils._slidingUserStrategy(strategy),
            current = utils._shiftIfNeeded(controller, pointerIndexLimit);

        if (controller.refreshIfNoSufficientColumns(current, pointerIndexLimit)) {
            utils._scrollBySelector(iScrolls[1], '.wc-time-slots td.wc-user-' + TimelyUi.currentUserId);
            utils._scrollBySelector(iScrolls[2], '#calendar-header-wrapper th.wc-user-' + TimelyUi.currentUserId);
            return false;
        }

        var next = controller.increment(current);
        var nextUser = loadedUsers[next];
        if (controller.checkForHidden(next, pointerIndexLimit)) {
            for (var j = 0; j < removedUserIdsLength; ++j) {
                removedUserId = removedUserIds[j];
                if (removedUserId === nextUser.id) {
                    next = controller.increment(current);
                    TimelyUi.currentUserId = loadedUsers[next].id;
                    next = utils._shiftIfNeeded(controller, pointerIndexLimit);
                    nextUser = loadedUsers[next];
                    break;
                }
            }
        }
        TimelyUi.current = next;
        TimelyUi.currentUserId = loadedUsers[next].id;

        controller.refreshIfNoSufficientColumns(current, pointerIndexLimit);

        utils._scrollBySelector(iScrolls[1], '.wc-time-slots td.wc-user-' + TimelyUi.currentUserId);
        utils._scrollBySelector(iScrolls[2], '#calendar-header-wrapper th.wc-user-' + TimelyUi.currentUserId);
    };

    TimelyUi.utils.getMaxPointerIndex = function () {
        var conf = TimelyUi.calendar.conf,
            loadedUsers = conf.loadedUsers,
            arrayTds = $('td.wc-day-column:visible');

        arrayTds.pop = Array.prototype.pop;
        if (arrayTds.length < TimelyUi.columnsToShow && arrayTds.length === 0) {
            return arrayTds.length;
        }
        for (var i = 0; i < TimelyUi.columnsToShow - 1; ++i) {
            arrayTds.pop();
        }
        try {
            var lastElement = arrayTds[arrayTds.length - 1];
            var userId = parseInt(lastElement.className.split('wc-user-')[1].split(' ')[0], 10);
            for (var index = 0; index < loadedUsers.length; ++index) {
                if (userId === loadedUsers[index].id) {
                    return index;
                }
            }
        } catch (err) {
        }
        return 0;
    };

    TimelyUi.utils.getMinPointerIndex = function () {
        var conf = TimelyUi.calendar.conf,
            loadedUsers = conf.loadedUsers,
            arrayTds = $('td.wc-day-column:visible');

        arrayTds.shift = Array.prototype.shift;
        if (arrayTds.length < TimelyUi.columnsToShow && arrayTds.length === 0) {
            return arrayTds.length;
        }
        try {
            var lastElement = arrayTds.shift();
            var userId = parseInt(lastElement.className.split('wc-user-')[1].split(' ')[0], 10);
            for (var index = 0; index < loadedUsers.length; ++index) {
                if (userId === loadedUsers[index].id) {
                    return index;
                }
            }
        } catch (err) {
        }
        return 0;
    };

    /************************************
     * Show hide user columns by buttons *
     *************************************/

    /**
     * Refresh the value of attr colspan in two DOM elements to render calendar widget correctly when users are added o removed.
     * Add a colspan means less users.
     * @param {boolean} isAdd must be true when an user is added
     */
    TimelyUi.utils._addColSpan = function (isAdd) {
        var options = TimelyUi.calendar.options,
            utils = TimelyUi.utils,
            $placeholder,
            $header,
            colspan;

        options.users = utils.refreshUsers(options.loadedUsers, options.removedUserIds);
        $placeholder = $('.wc-timeslot-placeholder');
        $header = $('.wc-day-column-header');
        colspan = parseInt($placeholder.attr('colspan'), 10);
        if (isAdd) {
            colspan++;
        } else {
            colspan--;
        }
        $placeholder.attr('colspan', colspan);
        $header.attr('colspan', colspan);
    };

    /**
     * Hide a single user in all widget, toggling the bounded button
     * @param {int} userId is the id of user to hide.
     */
    TimelyUi.utils._hideUserColumn = function (userId) {
        var options = TimelyUi.calendar.options,
            utils = TimelyUi.utils;

        options.removedUserIds.push(userId);
        utils._addColSpan(false);
        utils._redimColumnsWidth();
    };

    /**
     * Show a single user in all widget, toggling the bounded button
     * @param {int} userId is the id of user to show.
     */
    TimelyUi.utils._showUserColumn = function (userId) {
        var options = TimelyUi.calendar.options,
            utils = TimelyUi.utils;

        options.removedUserIds.splice(options.removedUserIds.indexOf(userId), 1);
        utils._addColSpan(true);
        utils._redimColumnsWidth();
    };

    /**
     * Used to center popover during its creation
     * @param element node
     * @returns {Object} with left and top position
     * @private
     */
    TimelyUi.utils._offset = function (element) {
        var left = -element.offsetLeft,
            top = -element.offsetTop;

        // Go back until top parent
        while (element !== null && (element = element.offsetParent)) {
            left -= element.offsetLeft;
            top -= element.offsetTop;
        }

        return {
            left: left,
            top: top
        };
    };

    /**
     * Refresh the value of attr width in some DOM elements to render calendar widget correctly when users are added o removed.
     */
    TimelyUi.utils._redimColumnsWidth = function () {
        var options = TimelyUi.calendar.options,
            width = $('#calendar-body-wrapper').width() - 45,
            isSafari = TimelyUi.compat.isSafari,
            maxColumnNumber = TimelyUi.maxColumnNumber;

        TimelyUi.columnsToShow = (maxColumnNumber > TimelyUi.columnsToShow) ? TimelyUi.columnsToShow : maxColumnNumber;
        // Added like a workaround on sliding header when user are less then maxColumnNumber
        if (maxColumnNumber > options.users.length) {
            TimelyUi.utils.disableIScroll(1);
            TimelyUi.utils.disableIScroll(2);
        } else {
            TimelyUi.utils.enableIScroll(1);
            TimelyUi.utils.enableIScroll(2);
        }
        var dividend = (options.users.length > TimelyUi.columnsToShow) ? TimelyUi.columnsToShow : options.users.length,
            rightSingleWidth = width / dividend,
            rightWidth = rightSingleWidth * options.users.length + 45;

        TimelyUi.dispelVodooMagic();
        $('.wc-body-scroller-placeholder, .wc-head-scroller-placeholder, .wc-time-slots').width(rightWidth);
        $('.wc-timeslot-placeholder').attr('colspan', dividend);

        var height = $('header').height();
        $('#scrollbar-wrapper').height($(window).height() - height);
        if (!TimelyUi.calendar.initedHeight) {
            var $wcScrollerHeight = $('.wc-scroller-height');
            var scrollHeight = $wcScrollerHeight.height();
            $wcScrollerHeight.height(scrollHeight + height);
            TimelyUi.calendar.initedHeight = true;
        }
        $.each(TimelyUi.iScrollEls, function (key, val) {
            val.refresh();
        });
        TimelyUi.vodooMagic();
        $('table .ui-state-default, table .wc-user-header').not('.wc-grid-timeslot-header, .wc-time-column-header').each(function (index, el) {
            try {
                $(this).get(0).clientWidth = rightSingleWidth;
            } catch(ex) {
                $(this).get(0).setAttribute('clientWidth', rightSingleWidth);
            }
            $(this).width(rightSingleWidth);
        });
    };

    TimelyUi.utils.toggleUserByButton = function (event, $button) {
        var calendar = TimelyUi.calendar,
            utils = TimelyUi.utils,
            userId = $button.data('user-id'),
            $wcUser = $('.wc-user-' + userId);

        if ($wcUser.is(':visible')) {
            utils._hideUserColumn(userId);
        } else {
            utils._showUserColumn(userId);
        }

        $wcUser.toggle();
        $button.button('toggle');
        calendar._drawCurrentHourLine();
    };

    TimelyUi.utils.disableIScroll = function (index) {
        TimelyUi.iScrollEls[index].disable();
    };

    TimelyUi.utils.enableIScroll = function (index) {
        var event = jQuery.Event('mouseup');
        TimelyUi.iScrollEls[index].enable();
        TimelyUi.iScrollEls[index].handleEvent(event);
    };

    TimelyUi.utils.disableIScrolls = function () {
        $.each(TimelyUi.iScrollEls, function (key, iscroll) {
            iscroll.disable();
        });
    };

    TimelyUi.utils.enableIScrolls = function () {
        var event = jQuery.Event('mouseup');
        $.each(TimelyUi.iScrollEls, function (key, iscroll) {
            iscroll.enable();
            iscroll.handleEvent(event);
        });
    };
    TimelyUi.utils.isDraggingEvent = false;

    /**
     * Refresh the TimelyUi.conf.users dictionary subtracting removedUserIds from loadedUsers.
     * @param {Object} loadedUsers is a dictionary of users. Default is TimelyUi.conf.loadedUsers
     * @param {Object} removedUserIds is a array of user ids. Default is TimelyUi.conf.removedUserIds
     */
    TimelyUi.utils.refreshUsers = function (loadedUsers, removedUserIds) {
        var endArray = loadedUsers,
            filter = TimelyUi.utils._filter;

        $.each(removedUserIds, function (index, userId) {
            endArray = filter(endArray, 'id', userId);
        });
        return endArray;
    };

    /**
     * Show a multiple users in all widget, toggling the bounded organization button
     * @param {int} organizationId is the id of organization to show, included all linked users.
     */
    TimelyUi.utils.showUsers = function (organizationId) {
        var options = TimelyUi.calendar.options,
            utils = TimelyUi.utils,
            filter = TimelyUi.utils._filter,
            endArray = [];

        endArray = filter(options.currentUserOrganizations, 'id', organizationId, true);
        if (endArray.length === 1) {
            var organization = endArray[0];
            $.each(organization.users, function (index, userId) {
                var event = jQuery.Event('click');
                var $button = $('button[data-user-id="' + userId + '"]');
                if (!$button.hasClass('active')) {
                    utils.toggleUserByButton(event, $button);
                }
            });
        }
    };

    /*****************
     * Datetime utils *
     *****************/

    /**
     * Moment.js wrapper
     * @param {Object} date with any format
     * @param {String} format a valid Moment.js format string
     * @return {String} a formatted datetime
     */
    TimelyUi.utils.formatDate = function (date, format) {
        return moment(date).format(format);
    };

    /**
     * Moment.js wrapper
     * @param {Object} date with any format
     * @return {Date} a POJO date
     */
    TimelyUi.utils.toDate = function (date) {
        return moment(date).toDate();
    };

    /**
     * Format date object to Pickadate.js valid time.
     * @param {Object} date object to parse
     * @return {Array} array with [hour, minutes] values
     */
    TimelyUi.utils.timeToArray = function (date) {
        var momentDate = moment(date);
        return [momentDate.hour(), momentDate.minutes()];
    };

    /**
     * Use Moment.js to parse date and time into ISO-8601 format.
     * @param {Object} date with a format YYYY-MM-DD (2000-12-31)
     * @param {Object} time with a format HH:MM (23:59)
     * @return {String} a valid ISO-8601 format
     */
    TimelyUi.utils.datetimeISOFormat = function (date, time) {
        return moment(date + ' ' + time, 'MM-DD-YYYY HH:mm').format();
    };

    /**
     * Convert datetime to a valid UNIX timestamp
     * @param {Object} date with any format
     * @return {String} a valid UNIX timestamp
     */
    TimelyUi.utils.toTimestamp = function (date) {
        return moment(date).format('X');
    };

    /******************
     * Array filtering *
     ******************/

    /**
     * Return a list of common organizations
     * @param {Array} collection which should be filtered
     * @param {Number} id of object to search
     * @return {Object} object found
     */
    TimelyUi.utils._findById = function (collection, id) {
        return _.find(collection, function (object) {
            return object.id === id;
        });
    };

    /**
     * Return a list of common organizations
     * @param {Array} firstOrganizations which contain first user
     * @param {Array} secondOrganizations which contain second user
     * @return {Array} shared organizations between two users
     */
    TimelyUi.utils._commonOrganizations = function (firstOrganizations, secondOrganizations) {
        return _.intersection(firstOrganizations, secondOrganizations);
    };

    /**
     * Default logic to choose an organization from a list of shared organizations
     * @param {Array} organizations shared by two users
     * @return {Object} valid organization
     */
    TimelyUi.utils._chooseDefaultOrganization = function (organizations) {
        return organizations[0];
    };

    /**
     * Choose an organization between two users
     * @param {Array} currentUserOrganizations which contain first user
     * @param {Array} userOrganizations which contain second user
     * @return {Object} valid organization
     */
    TimelyUi.utils.chooseOrganization = function (currentUserOrganizations, userOrganizations) {
        var commonOrganizations = this._commonOrganizations(currentUserOrganizations, userOrganizations);
        return this._chooseDefaultOrganization(commonOrganizations);
    };
})(TimelyUi);