'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    addBranches: false,
    aha: false,
    aha0: false, // step 1: create sandbox
    aha1: false, // step 2: working repo config
    aha1ExitedEarly: false, // step 2: if the user left the flow before getting a running config
    aha2: false, // step 3: add branch
    aha3: false, // step 4: runnabot
    ahaInContainersView: false, // used to represent when the user is in the containers view
    ahaOverview: false, // toggle aha intro in sidebar
    ahaSidebar: false, // toggle sidebar
    allowIsolatedUpdate: false,
    autoIsolation: false,
    autoIsolationSetup: false,
    backup: false,
    blankDockerfile: false, // allows users to skip the verification flow
    billing: true,
    cardStatus: false,
    connections: false,
    configTerminal: false, // flag for terminal in config view
    containersViewTemplateControls: false,
    containersViewEmptyState: false,
    dockerfileMirroringMultiple: false,
    editAnyInstance: false,
    emptyFolder: false, // shows empty folder markup
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    gitHubIntegration: false,
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    intercomOnMigration: false, // adds intercom link to migration message
    internalDebugging: false,
    inviteFlows: false,
    multilineFnR: false,
    multilineStartCmd: false,
    multipleRepositoryContainers: false, // for adding multiple containers with the same repository
    navListFilter: false,
    nextPayment: false, // show the next payment date under payment summary
    newUserPrompt: false, // modal for new users
    noBuildLogs: true,
    optionsInModal: false, // allows delete in modal
    renameContainer: false,
    saveToolbar: false,
    teamManagement: false,
    teamManagementAdvanced: false, // changes text from org to team in account menu
    testingFeature: false,
    themeToggle: false, // toggles the button that toggles theme
    trial: false, // sets account to trial mode
    undoDelete: false, // undo delete configuration
    webhooks: false,
    webToolbar: false, // webview toolbar
    whitelistIpFiltering: false
  };

  var _featureFlags = {};


  Object.keys(defaultFeatureFlags).forEach(function (key) {
    _featureFlags[key] = defaultFeatureFlags[key];
  });

  if($localStorage.featureFlags){
    Object.keys($localStorage.featureFlags).forEach(function (flag) {
      _featureFlags[flag] = $localStorage.featureFlags[flag];
    });
  }

  return {
    reset: function () {
      Object.keys(defaultFeatureFlags).forEach(function (key) {
        _featureFlags[key] = defaultFeatureFlags[key];
      });
      return _featureFlags;
    },
    flags: _featureFlags,
    changed: function () {
      return !!Object.keys(defaultFeatureFlags).find(function (featureFlag) {
        return defaultFeatureFlags[featureFlag] !== _featureFlags[featureFlag];
      });
    }
  };
}
