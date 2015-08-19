'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  $localStorage
) {
  return {
    restrict: 'A',
    templateUrl: 'explorerView',
    controller: 'FilePopoverController as FPC',
    scope: {
      instance: '=',
      openItems: '=',
      fileModel: '=',
      rootDir: '=',
      explorerTitle: '@',
      toggleTheme: '=',
      showRepoFolder: '=',
      editExplorer: '=?',
      loadingPromisesTarget: '@?',
      readOnly: '=?'
    },
    link: function ($scope) {
      $scope.dir = $scope.rootDir;
      $scope.$storage = $localStorage.$default({
        explorerIsClosed: false
      });
      $scope.state = {};

      $scope.filePopover = {
        data: {
          show: false,
          canUpload: $scope.editExplorer,
          canAddRepo: $scope.editExplorer
        }
      };

      $scope.$watch('rootDir', function (rootDir) {
        if (!rootDir) { return; }
        initRootDirState(rootDir);
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}