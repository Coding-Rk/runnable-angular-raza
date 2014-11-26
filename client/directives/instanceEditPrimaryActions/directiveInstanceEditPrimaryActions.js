require('app')
  .directive('instanceEditPrimaryActions', instanceEditPrimaryActions);
/**
 * @ngInject
 */
function instanceEditPrimaryActions(
  async,
  keypather,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditPrimaryActions',
    replace: true,
    scope: {
      instance: '=',
      loading: '=',
      openItems: '='
    },
    link: function ($scope, elem, attrs) {
      // prevent multiple clicks
      var building = false;
      $scope.build = function (noCache) {
        if (building) return;
        building = true;
        $scope.loading = true;
        var unwatch = $scope.$watch('openItems.isClean()', function (n) {
          if (!n) { return; }
          unwatch();
          var buildObj = {
            message: 'Manual build'
          };
          async.series([
            fetchNewBuild,
            function (cb) {
              if (!noCache) {
                return cb();
              }
              var cv = $scope.newBuild.contextVersions.models[0];
              var file = cv.rootDir.contents.find(function(file) {
                return (file.attrs.name === 'Dockerfile');
              });
              file.update({
                json: {
                  body: file.attrs.body
                }
              }, cb);
            },
            function () {
              $scope.newBuild.build(
                buildObj,
                function (err, build) {
                  if (err) throw err;
                  var opts = {
                    build: $scope.newBuild.id()
                  };
                  if ($scope.instance.state && $scope.instance.state.env) {
                    opts.env = $scope.instance.state.env;
                  }
                  $scope.instance.update(opts, function (err) {
                    if (err) throw err;
                    // will trigger display of completed message if build completes
                    // before reaching next state
                    // $scope.dataInstanceLayout.data.showBuildCompleted = true;
                    $state.go('instance.instance', $stateParams);
                  });
                });
            }]);
        });
      };

      $scope.popoverBuildOptions = {
        data: {},
        actions: {
          noCacheBuild: function () {
            $scope.popoverBuildOptions.data.show = false;
            $scope.build(true);
          }
        }
      };

      function fetchNewBuild(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.newBuild = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

    }
  };
}
