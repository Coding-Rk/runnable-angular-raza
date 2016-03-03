'use strict';

require('app').controller('BuildLogsController', BuildLogsController);

function BuildLogsController(
  $scope,
  $rootScope,
  $timeout,
  errs,
  launchDebugContainer,
  loading,
  updateInstanceWithNewBuild,
  primus,
  promisify,
  streamingLog,
  watchOncePromise
) {
  var BLC = this;
  BLC.showDebug = false;

  function handleUpdate () {
    var status = BLC.instance.status();
    BLC.showErrorPanel = false;
    if (status === 'buildFailed' || status === 'neverStarted') {
      var buildError = BLC.instance.attrs.contextVersion.build.error || {};
      BLC.buildStatus ='failed';
      BLC.failReason = buildError.message || 'failed';
      BLC.showDebug = true;
      BLC.buildLogsRunning = false;
      if (status === 'neverStarted') {
        BLC.showErrorPanel = true;
      }
    } else if (status === 'building') {
      BLC.buildStatus = 'running';
      BLC.buildLogsRunning = true;
      BLC.showDebug = false;
    } else {
      BLC.buildStatus = 'success';
      BLC.buildLogsRunning = false;
    }
  }

  var failCount = 0;
  var streamDelay = 500;
  var watchDockerContainerIdPromise = null;

  function setupStream() {
    BLC.streamFailure = false;
    var stream = null;
    if (BLC.instance) {
      BLC.buildStatus = 'starting';
      BLC.buildLogs = [];
      BLC.buildLogTiming = {};
      watchDockerContainerIdPromise =
        watchOncePromise($scope, 'BLC.instance.attrs.contextVersion.build.dockerContainer', true);
      watchDockerContainerIdPromise
        .then(function () {
          if (!watchDockerContainerIdPromise) {
            // we should not have this happen, so if it does, report it, and leave
            errs.report(new Error('Attempted to connect to a stream twice'));
            return;
          }
          watchDockerContainerIdPromise = null;
          stream = primus.createBuildStream(BLC.instance.build);
          handleUpdate();
          BLC.instance.on('update', handleUpdate);
          $scope.$on('$destroy', function () {
            BLC.instance.off('update', handleUpdate);
          });
          connectListenersToStream(stream);
        });
    } else if (BLC.debugContainer) {
      stream = primus.createBuildStreamFromContextVersionId(BLC.debugContainer.attrs.contextVersion);
      connectListenersToStream(stream);
    }
  }
  function connectListenersToStream(stream) {
    stream.on('data', function () {
      stream.hasData = true;
    });
    stream.on('end', function () {
      if (!stream.hasData) {
        failCount++;
        if (failCount > 10) {
          BLC.streamFailure = true;
          BLC.buildLogsRunning = false;
        } else {
          streamDelay = Math.floor(streamDelay * 1.3);
          $timeout(function () {
            setupStream();
          }, streamDelay);
        }
      } else {
        BLC.buildLogsRunning = false;
      }
      $scope.$applyAsync();
    });
    stream.on('disconnection', function () {
      setupStream();
      $scope.$applyAsync();
    });
    var streamingBuildLogs = streamingLog(stream);
    $scope.$on('$destroy', function () {
      if (stream && stream.end) {
        stream.end();
      }
      BLC.buildLogsRunning = false;
      streamingBuildLogs.destroy();
    });
    BLC.buildLogs = streamingBuildLogs.logs;
    BLC.buildLogTiming = streamingBuildLogs.times;
    BLC.getRawLogs = streamingBuildLogs.getRawLogs;
  }

  BLC.getBuildLogs = function () {
    if (BLC.instance) {
      return BLC.buildLogs;
    }
    if (BLC.debugContainer) {
      var newBuildLogs = [];
      for (var i=0; i<BLC.buildLogs.length; i++) {
        var command = BLC.buildLogs[i];
        newBuildLogs.push(command);
        if (command.imageId === BLC.debugContainer.attrs.layerId) {
          return newBuildLogs;
        }
      }
      return newBuildLogs;
    }
  };

  setupStream();

  this.generatingDebug = false;
  this.actions = {
    openIntercom: function () {
      window.Intercom(
        'showNewMessage',
        'Fudge! This thing won’t build my container. Can you fix it?'
      );
    },
    rebuildWithoutCache: function () {
      loading('buildLogsController', true);
      promisify(BLC.instance.build, 'deepCopy')()
        .then(function (build) {
          return updateInstanceWithNewBuild(
            BLC.instance,
            build,
            true
          );
        })
        .catch(errs.handler)
        .finally(function () {
           loading('buildLogsController', false);
        });
    },
    launchDebugContainer: function (event, command) {
      if (BLC.debugContainer) {
        return;
      }
      $rootScope.$emit('close-popovers');
      if (BLC.generatingDebug) {
        return;
      }

      BLC.generatingDebug = true;
      launchDebugContainer(BLC.instance.id(), BLC.instance.attrs.contextVersion._id, command.imageId, command.rawCommand)
        .then(function () {
          BLC.generatingDebug = false;
        });
    }
  };
}


