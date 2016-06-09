'use strict';

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 *
 * Attributes:
 *  backgroundButtons: Comma separated list of the tabs that can be allowed and added
 *
 */
function activePanel(
  $sce,
  cleanStartCommand,
  errs,
  keypather,
  loading,
  promisify,
  updateInstanceWithNewBuild
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      instance: '=',
      build: '=',
      validation: '=',
      stateModel: '=',
      isEditModal: '=?',
      debugContainer: '=?'
    },
    link: function ($scope, element, attrs) {
      $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;

      $scope.startCommand = function () {
        var cmd = keypather.get($scope, 'instance.containers.models[0].attrs.inspect.Config.Cmd[2]');
        return cleanStartCommand(cmd);
      };

      $scope.showDebugCmd = false;
      $scope.$on('debug-cmd-status', function (evt, status) {
        $scope.showDebugCmd = status;
      });

      $scope.getTestingStatus = function () {
        var status = keypather.get($scope, 'instance.status()');
        var testingStatusMap = {
          stopped: 'passed',
          crashed: 'failed',
          running: 'inProgress'
        };
        if (keypather.get($scope, 'instance.attrs.isTesting') && testingStatusMap[status]) {
          return testingStatusMap[status];
        }
        return null;
      };

      $scope.rebuildWithoutCache = function () {
        loading('main', true);
        promisify($scope.instance.build, 'deepCopy')()
          .then(function (build) {
            return updateInstanceWithNewBuild(
              $scope.instance,
              build,
              true
            );
          })
          .catch(errs.handler)
          .finally(function () {
            loading('main', false);
          });
      };
    }
  };
}
