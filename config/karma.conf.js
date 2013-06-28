// Karma configuration

// base path, that will be used to resolve files and exclude
basePath = '../';

// list of files / patterns to load in the browser
files = [
  QUNIT,
  QUNIT_ADAPTER,
  'src/assets/enquire/dist/enquire.js',
  'src/assets/jquery/jquery.js',
  'src/assets/jquery-ui/ui/jquery-ui.js',
  'src/assets/moment/moment.js',
  'src/jquery.weekcalendar.init.js',
  'src/utils.js',
  'src/jquery.weekcalendar.js',
  'src/assets/jquery.slimscroll/jquery.slimscroll.js',
  'src/assets/datejs/build/date.js',
  'test/tests.js'
];

preprocessors = {
  'src/*.js': 'coverage'
};

// list of files to exclude
exclude = [];

// test results reporter to use
// possible values: dots || progress || growl
reporters = ['coverage', 'progress'];

coverageReporter = {
  type : ['text'],
  dir: 'coverages/'
}

// web server port
port = 8080;

// cli runner port
runnerPort = 9100;

// enable / disable colors in the output (reporters and logs)
colors = true;

// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;

// enable / disable watching file and executing tests whenever any file changes
autoWatch = false;

// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['PhantomJS'];

// If browser does not capture in given timeout [ms], kill it
captureTimeout = 5000;

// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
