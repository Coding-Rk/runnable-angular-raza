'use strict';

require('app')
  .directive('statusIcon', statusIcon);

function statusIcon(
  getInstanceClasses
) {
  return {
    restrict: 'E',
    scope: {
      instance: '='
    },
    replace: true,
    templateUrl: 'viewStatusIcon',
    link: function ($scope) {
      $scope.getInstanceClasses = getInstanceClasses;
    }
  };
}