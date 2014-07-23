var queryAssist = require('queryAssist');
require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp(
  $rootScope,
  $scope,
  $timeout,
  $document,
  $stateParams,
  $state,
  user,
  apiConfig,
  holdUntilAuth
) {

  var self = ControllerApp;
  var UTIL = $rootScope.UTIL = {};
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
    $stateParams,
    apiConfig.host);

  dataApp.documentClickEventHandler = function () {
    $scope.$broadcast('app-document-click');
  };

  $rootScope.safeApply = function (cb) {
    $timeout(function () {
      if (typeof cb === 'function') {
        $scope.$apply(cb);
      } else {
        $scope.$apply();
      }
    });
  };

  UTIL.holdUntilAuth = function (cb) {
    holdUntilAuth(function (err, thisUser) {
      if (err) {
        $state.go('home', {});
      } else {
        dataApp.user = thisUser;
        $scope.safeApply();
        if (angular.isFunction(cb)) {
          cb(err);
        }
      }
    });
  };
  UTIL.clickPos = function (e) {
    var x = 0,
      y = 0;
    if (e.pageX || e.pageY) {
      x = e.pageX;
      y = e.pageY;
    }
    return {
      x: x,
      y: y
    };
  };
  UTIL.QueryAssist = queryAssist;
}

ControllerApp.initState = function ($state, $stateParams, apiHost) {
  return {
    state: $state,
    stateParams: $stateParams,
    user: null,
    loginURL: apiHost + '/auth/github?redirect=' + encodeURI('http://localhost:3001'),
    logoutURL: apiHost + '/auth/logout?redirect=' + encodeURI('http://localhost:3001')
  };
};
