'use strict';
var TimelyUi = TimelyUi || {};
TimelyUi.calendar = TimelyUi.calendar || {};

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
