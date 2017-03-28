'use strict';

require('app')
  .controller('BranchTestListController', BranchTestListController);
/**
 * controller BranchTestListController
 * @ngInject
 */
function BranchTestListController(
  fetchCommitData,
  fetchInstanceTestHistory,
  keypather
) {
  var BTLC = this;
  var TEST_STATES = {
    PASSED: 1,
    FAILED: 2,
    UNKNOWN: 3
  };

  BTLC.appCodeVersion = BTLC.instance.contextVersion.getMainAppCodeVersion();
  BTLC.branch = fetchCommitData.activeBranch(BTLC.appCodeVersion);

  fetchInstanceTestHistory(BTLC.instance.attrs.id)
    .then(function(tests) {
      var testHash = {};
      tests.forEach(function(test) {
        testHash[test.commitSha] = test;
      });

      BTLC.branch.commits.models.forEach(function(com) {
        com.test = getTestState(testHash[com.attrs.sha]);

        if (BTLC.appCodeVersion.attrs.commit === com.attrs.sha) {
          BTLC.commit = com;
        }
      });

      return;
    });

  function getTestState(test) {
    if (test && keypather.get(test, 'build.stop').valueOf() !== new Date(0).valueOf()) {
      if (keypather.get(test, 'build.failed') || keypather.get(test, 'application.exitCode') > 0) {
        return TEST_STATES.FAILED;
      } else if (keypather.get(test,'application.exitCode') === 0 && keypather.get(test,'application.stop').valueOf() !== new Date(0).valueOf()) {
        return TEST_STATES.PASSED;
      }
    }

    return TEST_STATES.UNKNOWN;
  }
}
