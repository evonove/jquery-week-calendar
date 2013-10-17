'use strict';

// Namespace creation
var TimelyUi = TimelyUi || {};

(function(undefined) { 'use strict';
    TimelyUi.calendar = TimelyUi.calendar || {};
    
    TimelyUi.init = function(id, conf) {
        // i18n localization
        var _availableLanguage = ['en', 'it'],
            _currentLanguage = (window.navigator.userLanguage || window.navigator.language).split('-')[0],
            _selectedLanguage = _.contains(_availableLanguage, _currentLanguage) ? _currentLanguage : 'en';

        moment.lang(_selectedLanguage);

        // Calendar initialization
        TimelyUi._widgetStatus = TimelyUi.utils.mediaQueryCheck();
        TimelyUi.maxColumnNumber = TimelyUi.columnsToShow = TimelyUi._widgetStatus.columns;

        TimelyUi.calendar = $('#' + id).weekCalendar(conf).data('ui-weekCalendar');
        TimelyUi.calendar.conf = conf;
        TimelyUi.calendar.id = id;
        TimelyUi.utils._resetIScrolls();

        return true;
    };
})();
