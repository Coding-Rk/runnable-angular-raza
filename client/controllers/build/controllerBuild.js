var app     = require('app');
var angular = require('angular');
var deps    = [
  '$scope',
  'user',
  'async',
  '$stateParams'
];
deps.push(ControllerBuild);
app.controller('ControllerBuild', deps);
function ControllerBuild ($scope,
                          user,
                          async,
                          $stateParams) {
  var dataBuild = $scope.dataBuild = {};

  async.waterfall([
    function tempHelper (cb) {
      if (user.id()) {
        cb();
      } else {
        user.login('runnableUser9', 'asdfasdf9', function () {
          cb();
        });
      }
    },
    function fetchProject (cb) {
      var projects = user.fetchProjects({
        ownerUsername: $stateParams.ownerUsername,
        name:          $stateParams.name
      }, function (err, body) {
        if(err) return cb(err); // error handling
        cb(null, projects.models[0]);
      });
    },
    function fetchEnvironment (project, cb) {
      // TODO error check
      var environmentJSON = project.toJSON().environments.filter(hasProps({name: 'master'}))[0];
      var environment = project.newEnvironment(environmentJSON);
      cb(null, project, environment);
    },
    function fetchBuild (project, environment, cb) {
      var build = environment.fetchBuild($stateParams.buildId, function (err, body) {
        if (err) return cb(err); // TODO error handling
        cb(null, project, environment, build);
      });
    },
    function newBuildVersion (project, environment, build, cb) {
      var versionId = build.toJSON().versions[0];
      var version = build.newVersion(versionId);
      cb(null, project, environment, build, version);
    },
    function fetchRootFiles (project, environment, build, version, cb) {
      var rootDirFiles = version.fetchFiles({Prefix: '/'}, function () {
        //...... TODO
      });
    }
  ], function (err, project, environment, build) {
    console.log(arguments);
    $scope.$apply(function () {});
  });

}