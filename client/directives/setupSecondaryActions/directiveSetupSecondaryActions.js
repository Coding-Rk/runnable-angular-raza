require('app')
  .directive('setupSecondaryActions', setupSecondaryActions);
/**
 * @ngInject
 */
function setupSecondaryActions(
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupSecondaryActions',
    replace: true,
    scope: {
      saving: '=',
      stateModel: '='
    },
    link: function ($scope, elem, attrs) {
      keypather.set($scope, 'actions.actionsModalEnvironment', {
        save: function () {
          $scope.actions.actionsModalEnvironment.close();
        }
      });
    }
  };
}
