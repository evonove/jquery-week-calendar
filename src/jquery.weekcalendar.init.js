'use strict';
var TimelyUi = TimelyUi || {};
TimelyUi.calendar = TimelyUi.calendar || {};
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
    // i18n localization
    var _availableLanguage = ['en', 'it'],
        _currentLanguage = (window.navigator.userLanguage || window.navigator.language).split('-')[0],
        _selectedLanguage = _.contains(_availableLanguage, _currentLanguage) ? _currentLanguage : 'en';

    moment.lang(_selectedLanguage);

    // Calendar initialization
    TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
    TimelyUi.calendar.conf = conf;
    TimelyUi.calendar.id = id;

    TimelyUi.calendar.lastRefresh = new Date().getTime();
    TimelyUi.calendar.lastWidth = window.innerWidth;
    TimelyUi.calendar.lastHeight = window.innerHeight;
    TimelyUi.calendar.initedHeight = false;

    TimelyUi.utils._resetIScrolls();
};
