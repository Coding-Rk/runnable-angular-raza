require('app')
  .directive('accountsSelect', accountsSelect);
/**
 * This directive is in charge of displaying the active account, and modifies the activeAccount
 * on the scope, which then propigates down the parent's scope.  It doesn't fetch anything, since
 * the parent fetches both the user and their orgs.
 * @ngInject
 */
function accountsSelect (
  $state,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewAccountsSelect',
    scope: {
      data: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverAccountMenu = {
        actions: {
          actionsModalIntegrations: {}
        },
        data: $scope.data
      };
      $scope.popoverAccountMenu.data.dataModalIntegrations = $scope.data;

      $scope.popoverAccountMenu.actions.selectActiveAccount = function (userOrOrg) {
        $scope.popoverAccountMenu.data.show = false;
        var username = userOrOrg.oauthName();
        $scope.data.activeAccount = userOrOrg;
        $scope.data.instances = null;
        $scope.$emit('INSTANCE_LIST_FETCH', username);
        $state.go('^.home', {
          userName: username
        });
      };

      var mActions = $scope.popoverAccountMenu.actions.actionsModalIntegrations;
      var mData = $scope.popoverAccountMenu.data.dataModalIntegrations;

      var unwatch = $scope.$watch('popoverAccountMenu.data.dataModalIntegrations.user', function(n) {
        if (n) {
          mData.modalActiveAccount = mData.user;
          unwatch();
        }
      });

      mActions.closePopover = function() {
        $scope.popoverAccountMenu.data.show = false;
      };
      mActions.setActive = function(account) {
        mData.modalActiveAccount = account;
      };
    }
  };
}
