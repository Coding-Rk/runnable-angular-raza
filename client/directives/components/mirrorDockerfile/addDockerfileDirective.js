'use strict';

require('app')
  .directive('addDockerfile', addDockerfile);

function addDockerfile(
  $q,
  $timeout,
  fetchRepoDockerfile,
  doesDockerfileExist
) {
  return {
    restrict: 'A',
    require: '^mirrorDockerfile',
    templateUrl: 'addDockerfileView',
    scope: {
      branchName: '=',
      fullRepo: '=',
      viewState: '=',
      fileType: '@'
    },
    link: function ($scope, elem, attrs, MDC) {
      var COMPOSE_DEFAULT = 'docker-compose.yml';
      var COMPOSE_TEST_DEFAULT = 'docker-compose.test.yml'
      var DOCKER_DEFAULT = 'Dockerfile';
      var path;

      if ($scope.fileType === 'Docker Compose') {
        $scope.fileName = COMPOSE_DEFAULT;
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        MDC.state.types.stage = true;
        path = '/' + COMPOSE_DEFAULT;
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, path, $scope.fileType);

      } else if ($scope.fileType === 'Docker Compose Test') {
        $scope.fileName = COMPOSE_TEST_DEFAULT;
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        MDC.state.types.test = true;
        path = '/' + COMPOSE_TEST_DEFAULT;
      } else if ($scope.fileType === 'Dockerfile') {
        $scope.fileName = DOCKER_DEFAULT;
        $scope.fileLabel = 'Dockerfile';
        $scope.formLabel = 'Dockerfile Path';
        path = '/' + DOCKER_DEFAULT
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, path, $scope.fileType);
      }

      fetchRepoDockerfile($scope.fullRepo, $scope.branchName, path)
        .then(doesDockerfileExist)
        .then(function (file) {
          if (file) {
            $scope.newDockerfile = $scope.fileName;
          }
        })

      $scope.$on('dockerfileExistsValidator', function ($event, path, fileType, dockerfile) {
        if (fileType === $scope.fileType) {
          $scope.dockerfile = dockerfile;
        }
      });

      $scope.closeDockerFileInput = function () {
        if ($scope.fileType === 'Docker Compose') {
          $scope.viewState.showAddDockerComposeFile = false;
          return;
        }
        $scope.viewState.showAddDockerfile = false;
      };
    }
  };
}
