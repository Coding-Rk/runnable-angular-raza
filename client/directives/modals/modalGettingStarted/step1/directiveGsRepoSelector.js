'use strict';

require('app')
  .directive('gsRepoSelector', gsRepoSelector);
/**
 * @ngInject
 */
function gsRepoSelector(
  async,
  keypather,
  errs,
  fetchGSDepInstances,
  fetchStackAnalysis,
  fetchUser,
  hasKeypaths,
  $stateParams,
  $timeout,
  QueryAssist
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalRepoSelector',
    scope: {
      actions: '=',
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      function fetchStackData(repo, cb) {
        fetchStackAnalysis(repo, function (err, data) {
          if (err) { return cb(err); }
          if (!data.languageFramework) { return cb(new Error('No languages found'));}
          $scope.state.stack = $scope.data.stacks.find(hasKeypaths({
            'name.toLowerCase()': data.languageFramework.toLowerCase()
          }));
          if (data.serviceDependencies && data.serviceDependencies.length) {
            $scope.$watch('data.allDependencies', function (allDeps) {
              if (allDeps) {
                var includedDeps = data.serviceDependencies.map(function (dep) {
                  return allDeps.models.find(hasKeypaths({'attrs.name': dep})) || false;
                });
                includedDeps.forEach(function (dep) {
                  if (dep) {
                    $scope.actions.addDependency(dep);
                  }
                });
              }
            });
          }
          cb();
        });
      }
      $scope.selectRepo = function (repo) {
        if ($scope.state.repoSelected) { return; }
        $scope.state.repoSelected = true;
        repo.spin = true;
        $scope.state.selectedRepo = repo;
        repo.branches.fetch(function(err) {
          if (err) {return errs.handler(err); }
          $scope.state.activeBranch =
              repo.branches.models.find(hasKeypaths({'attrs.name': 'master'}));
          if (!$scope.state.activeBranch) { return errs.handler(new Error('No branches found')); }
          $scope.state.activeBranch.commits.fetch(angular.noop);
        });
        fetchStackData(repo.attrs.full_name, function (err) {
          if (err) { $scope.state.repoSelected = false; }
          delete repo.spin;
          $scope.actions.nextStep(2);
          errs.handler(err);
        });
      };
      function getOwnerRepoQuery(user, userName, cb) {
        if (userName === user.attrs.accounts.github.username) {
          // does $stateParam.username match this user's username
          return new QueryAssist(user, cb).wrapFunc('fetchGithubRepos');
        } else {
          return new QueryAssist(user.newGithubOrg(userName), cb).wrapFunc('fetchRepos');
        }
      }
      function fetchAllOwnerRepos(user, cb) {
        var pageFetchState = 1;
        function fetchPage(page) {
          var userOrOrg = getOwnerRepoQuery(
            user,
            $stateParams.userName,
            cb
          );
          userOrOrg
            .query({
              page: page,
              sort: 'updated'
            })
            .cacheFetch(function (githubRepos, cached, cb) {
              /**
               * Double concat to models arr
               * if logic run twice (cached & non-cached)
               */
              if (page < pageFetchState) { return cb(); }
              pageFetchState++;
              if (!$scope.githubRepos) {
                $scope.githubRepos = githubRepos;
              } else {
                var reposArr = $scope.githubRepos.models.concat(githubRepos.models);
                $scope.githubRepos = user.newGithubRepos(reposArr, {
                  noStore: true
                });
              }
              // recursive until result set returns fewer than
              // 100 repos, indicating last paginated result
              if (githubRepos.models.length < 100) {
                $scope.loading = false;
                cb();
              } else {
                fetchPage(page + 1);
              }
            })
            .resolve(function (err, githubRepos, cb) {
              cb();
            })
            .go();
        }
        fetchPage(1);
      }
      async.waterfall([
        function (cb) {
          $scope.loading = true;
          cb();
        },
        fetchUser,
        fetchAllOwnerRepos
      ], errs.handler);
    }
  };
}
