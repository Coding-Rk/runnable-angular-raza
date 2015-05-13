'use strict';

require('app')
  .directive('instanceList', instanceList);
/**
 * @ngInject
 */
function instanceList(
  getInstanceClasses,
  getInstanceAltTitle,
  getTeamMemberClasses,
  $state,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceList',
    scope: {
      data: '=',
      state: '=',
      actions: '='
    },
    link: function ($scope) {
      $scope.isLoading = $rootScope.isLoading;

      $scope.stateToInstance = function (instance, $event) {
        if ($event && $event.preventDefault) {
          $event.preventDefault();
        }
        $state.go('instance.instance', {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.username
        });
      };

      $scope.isSelected = function (instance) {
        return instance.attrs.name === $state.params.instanceName;
      };

      $scope.getInstanceClasses = getInstanceClasses;
      $scope.getInstanceAltTitle = getInstanceAltTitle;
      $scope.getTeamMemberClasses = getTeamMemberClasses;

      $scope.popoverInvite = {
        data: {
          getTeamName: function () {
            return $state.params.userName;
          }
        }
      };
    }
  };
}
