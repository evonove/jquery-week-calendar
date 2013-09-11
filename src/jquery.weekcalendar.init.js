'use strict';

var TimelyUi = TimelyUi || {};
TimelyUi.calendar = TimelyUi.calendar || {};
TimelyUi.iScrollEls = TimelyUi.iScrollEls || {};

TimelyUi.initIScrolls  = function(justHeader_) {
    var justHeader = (justHeader_ === undefined) ? false : justHeader_;
    var iScroll2 = new IScroll('#calendar-header-wrapper', {
        scrollX: false,
        scrollY: false,
        momentum: true,
        bounce: false
    });

    TimelyUi.iScrollEls[2] = iScroll2;

    if (!justHeader){
        var iScroll0 = new IScroll('#scrollbar-wrapper', {
            scrollX: false,
            scrollY: true,
            momentum: true,
            mouseWheel: true,
            bounce: false
        });

        TimelyUi.iScrollEls[0] = iScroll0;

        var iScroll1 = new IScroll('#calendar-body-wrapper', {
            scrollX: false,
            scrollY: false,
            momentum: true,
            bounce: false
        });

        TimelyUi.iScrollEls[1] = iScroll1;
    }
};

TimelyUi.boundIScrolls = function() {
    var utils = TimelyUi.utils,
        goRight = utils._goRight,
        goLeft = utils._goLeft,
        events = TimelyUi.compat.events,
        on = TimelyUi.compat.on,
        off = TimelyUi.compat.off;

    $('.wc-go-right').each(function(index, el){
        off($(el), events.click, goRight);
        on($(el), events.click, goRight);
    });

    $('.wc-go-left').each(function(index, el){
        off($(el), events.click, goLeft);
        on($(el), events.click, goLeft);
    });

    $('[class^="wc-scroller-"]').each(function(index, el){
        var $el = $(el);
        var boundEvent = function(e) {
            $.each(TimelyUi.iScrollEls, function(key, val){
                if(el !== val.scroller){
                    val.handleEvent(e);
                }
            });
            e.preventDefault();
        };
        off($el, events.down, boundEvent);
        off($el, events.move, boundEvent);
        off($el, events.cancel, boundEvent);

        on($el, events.down, boundEvent);
        on($el, events.move, boundEvent);
        on($el, events.cancel, boundEvent);
    });
};

/**
 * TODO: Remove 'magic' behaviour
 */
TimelyUi.vodooMagic  = function() {
    $('[class^="wc-scroller-"]').css('position', 'relative');
};

/**
 * TODO: Remove 'magic' behaviour
 */
TimelyUi.dispelVodooMagic  = function() {
    $('[class^="wc-scroller-"]').css('position', 'absolute');
};

TimelyUi.init = function(id, conf) {
    TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
    TimelyUi.calendar.conf = conf;
    TimelyUi.calendar.id = id;
    TimelyUi.calendar.lastRefresh = new Date().getTime();
    TimelyUi.calendar.lastWidth = window.innerWidth;

    TimelyUi.utils._resetIScrolls(true, false);
};
