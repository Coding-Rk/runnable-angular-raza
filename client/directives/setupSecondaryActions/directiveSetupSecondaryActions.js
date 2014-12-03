require('app')
  .directive('setupSecondaryActions', setupSecondaryActions);
/**
 * @ngInject
 */
function setupSecondaryActions(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupSecondaryActions',
    replace: true,
    scope: {
      data: '=',
      stateModel: '=',
      currentModel: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.actions = {};
    }
  };
}
