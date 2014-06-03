var app     = require('./app');
var angular = require('angular');
var _       = require('underscore');

// Cache all views
var views = require('./build/views/viewBundle');
app.run(['$templateCache', function ($templateCache) {
  _.each(views.Templates, function (item, index) {
    console.log(index);
    $templateCache.put(index, item());
  });
}]);

// bundle application deps w/ browserify by requiring
require('./controllers/controllerAbout');
require('./controllers/controllerApp');
require('./controllers/controllerFeed');
require('./controllers/controllerLayout');

require('./router');

window.onload = function () {
  module.exports = angular.bootstrap(document, ['app']);
};
