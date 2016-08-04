'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    aha: false,
    aha0: false, // step 1: create sandbox
    aha1: false, // step 2: working repo config
    aha2: false, // step 3: add branch
    aha3: false, // step 4: runnabot
    allowIsolatedUpdate: false,
    autoIsolation: false,
    autoIsolationSetup: false,
    autoWhitelist: true,
    backup: false,
    billing: false,
    billingDiscounted: false,
    billingExpired: false,
    billingPlanChangedNotification: false, // if plan changes because of container created
    cardStatus: false,
    connections: false,
    dockerfileMirroringMultiple: false,
    editAnyInstance: false,
    emptyFolder: false, // shows empty folder markup
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    gracePeriod: false, // if user enters the grace period during the preview
    gracePeriodFooter: false, // adds footer links for change org and sign out when nav is unavailable
    gracePeriodPayment: false, // if the user enters the grace period because of a payment error
    gracePeriodTrial: false, // if the user enters the grace period because of trial expiring
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    intercomOnMigration: false, // adds intercom link to migration message
    internalDebugging: false,
    inviteFlows: false,
    isolationRepos: true, // for isolation UI
    multilineFnR: false,
    multilineStartCmd: false,
    multipleRepositoryContainers: false, // for adding multiple containers with the same repository
    nameContainer: true,
    navListFilter: false,
    newUserPrompt: false, // modal for new users
    newVerificationFlow: true,
    newVerificationFlowStackSelector: true,
    noBuildLogs: true,
    optionsInModal: false, // allows delete in modal
    renameContainer: false,
    saveToolbar: false,
    teamManagement: false,
    teamManagementAdvanced: false, // changes text from org to team in account menu
    testingFeature: false,
    themeToggle: false, // toggles the button that toggles theme
    trial: false, // sets account to trial mode
    trialEnding: false, // shows notification when trial is ending
    trialFooter: false, // toggles the footer in the trial/payments flow
    updatedSlackValidation: true,
    undoDelete: false, // undo delete configuration
    webhooks: false,
    whitelist: true,
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
