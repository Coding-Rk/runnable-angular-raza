require('app')
  .controller('ControllerSetup', ControllerSetup);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerSetup(
  $scope,
  $state,
  async,
  SharedFilesCollection
) {

  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerSetup;
  var dataSetup = $scope.dataSetup = self.initState();
  var data = dataSetup.data,
    actions = dataSetup.actions;
  data.userClient = user;

  // Determine readonly state
  $scope.$watch(function() {
    if (data.contextFiles) {
      return !data.isAdvanced;
    }
    return true;
  }, function (n) {
    data.isReadOnly = n;
  });

  actions.setActiveContext = function (context) {
    data.activeSeedContext = context;
    actions.fetchContextVersion();
  };
  actions.fetchContextVersion = function () {
    var context = data.activeSeedContext;
    fetchContextVersion(context, function() {
      fetchContextFiles(dataSetup.data.activeVersion);
    });
  };
  actions.buildApplication = function () {
    var context = dataSetup.data.context;
    async.waterfall([

      function (cb) {
        var version = context.createVersion({
          qs: {
            fromSource: dataSetup.data.activeVersion.attrs.infraCodeVersion,
            toBuild: dataSetup.data.build.id()
          },
          json: {
            environment: dataSetup.data.project.attrs.defaultEnvironment
          }
        }, function (err, version) {
          cb(null, version);
        });
      },
      function (version, cb) {
        dataSetup.data.build.build(function () {
          cb();
        });
      }
    ], function (err, res) {
      dataSetup.actions.stateToBuild();
    });
  };
  actions.stateToBuild = function () {
    $state.go('projects.build', {
      userName: $scope.dataApp.stateParams.userName,
      projectName: $scope.dataApp.stateParams.projectName,
      branchName: 'master',
      buildName: data.build.id()
    });
  };
  actions.initState = function () {
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      fetchProject,
      fetchSeedContexts,
      fetchDefaultBuild,
      fetchContext
    ], function (err) {});
  };
  actions.initState();

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchContextVersion(context, cb) {
    new QueryAssist(context, cb)
      .wrapFunc('fetchVersions')
      .cacheFetch(function updateDom(versions, cached, cb) {
        dataSetup.data.activeVersion = versions.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, versions, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchProject(thisUser, cb) {
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        githubUsername: $scope.dataApp.stateParams.userName,
        name: $scope.dataApp.stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        dataSetup.data.project = projects.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchDefaultBuild(cb) {
    var project = dataSetup.data.project;
    var environment = project.newEnvironment(project.attrs.defaultEnvironment);
    new QueryAssist(environment, cb)
      .wrapFunc('fetchBuilds')
      .cacheFetch(function updateDom(builds, cached, cb) {
        dataSetup.data.build = builds.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, builds, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchContext(cb) {
    var build = dataSetup.data.build;
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchContext')
      .query(build.attrs.contexts[0])
      .cacheFetch(function updateDom(context, cached, cb) {
        dataSetup.data.context = context;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, context, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchSeedContexts(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchContexts')
      .query({
        isSource: true
      })
      .cacheFetch(function updateDom(contexts, cached, cb) {
        dataSetup.data.seedContexts = contexts;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, contexts, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }
  function fetchContextFiles(contextVersion, cb) {
    new QueryAssist(contextVersion, cb)
      .wrapFunc('fetchFiles')
      .query({
        path: '/'
      })
      .cacheFetch(function updateDom(files, cached, cb) {
        dataSetup.data.contextFiles = new SharedFilesCollection(
          files,
          $scope
        );
        if (files.models && files.models[0]) {
          dataSetup.data.contextFiles.setActiveFile(files.models[0]);
        }
        $scope.safeApply();
        cb();
      })
      .resolve(function(err, contexts, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }
}

ControllerSetup.initState = function () {
  return {
    data: {
      isAdvanced: false,
      isRepoMode: false
    },
    actions: {}
  };
};
