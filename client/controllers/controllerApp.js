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
  $stateParams,
  $state,
  user,
  apiConfig,
  holdUntilAuth
) {

  var self = ControllerApp;
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
    $stateParams,
    apiConfig.host);

  dataApp.click = function () {
    self.documentLevelClick($scope);
  };

  dataApp.holdUntilAuth = function (cb) {
    holdUntilAuth(function (err, thisUser) {
      if (err) {
        $state.go('home', {});
      } else {
        $scope.safeApply(function () {
          dataApp.user = thisUser;
          cb(err, thisUser);
        });
      }
    });
  };

  $scope.safeApply = function (cb) {
    $timeout(function () {
      if (typeof cb === 'function') {
        $scope.$apply(cb);
      } else {
        $scope.$apply();
      }
    });
  };
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

ControllerApp.documentLevelClick = function ($scope) {
  $scope.$broadcast('app-document-click');
};
