'use strict';

require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'viewTabs',
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
    link: function ($scope, element, attrs) {
      $scope.state = $state;
      var actions = $scope.actions = {};
      var data = $scope.data = {};
    }
  };
}
