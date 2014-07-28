require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * ControllerInstance
 * @constructor
 * @export
 * @ngInject
 */
function ControllerInstance(
  $scope,
  $stateParams,
  async,
  user,
  SharedFilesCollection
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerInstance;
  var dataInstance = $scope.dataInstance = self.initData();
  var data = dataInstance.data,
    actions = dataInstance.actions;

  // init
  dataInstance.popoverAddTab = {
    filter: ''
  };

  dataInstance.showAddTab = false;
  dataInstance.showFileMenu = false;

  actions.restartInstance = function () {
    var newInstance = data.instance.restart(function (err) {
      if (err) {
        throw err;
      }
      data.instance = newInstance;
    });
  };

  $scope.$on('app-document-click', function () {
    dataInstance.data.showAddTab = false;
    dataInstance.data.showFileMenu = false;
    dataInstance.data.popoverAddTab.filter = '';
  });

  $scope.$watch(function () {
    if (data.openFiles && data.openFiles.activeFile) {
      return data.openFiles.activeFile.attrs.body;
    }
  }, function () {
    $scope.safeApply();
  });

  /* ============================
   *   API Fetch Methods
   * ===========================*/

  function fetchInstance (cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstance')
      .query($stateParams.instanceId)
      .cacheFetch(function updateDom(instance, cached, cb) {
        data.instance = instance;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instance, cb) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
        cb();
      })
      .go();
  }
  function fetchBuild(cb) {
    var thisUser = $scope.dataApp.user;
    var instance = data.instance;
    var env = thisUser
      .newProject(instance.attrs.project)
      .newEnvironment(instance.attrs.environment);
    new QueryAssist(env, cb)
      .wrapFunc('fetchBuild')
      .query(instance.attrs.build)
      .cacheFetch(function updateDom(build, cached, cb) {
        data.build = build;
        $scope.safeApply();
      })
      .resolve(function (err, build, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function newFilesCollOpenFiles(cb) {
    // tODO fetch container files
    var version = data.version;
    data.openFiles = new SharedFilesCollection(
      version.newFiles([], {
        noStore: true
      }),
      $scope
    );
    cb();
  }

  async.waterfall([
    holdUntilAuth,
    fetchInstance,
    fetchBuild
  ], function() {
    $scope.safeApply();
  });
}

ControllerInstance.initData = function () {
  return {
    data: {
      popoverAddTab: {
        filter: ''
      },
      showAddTab: false,
      showFileMenu: false
    },
    actions: {}
  };
};
