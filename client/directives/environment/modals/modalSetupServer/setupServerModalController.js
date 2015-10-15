'use strict';

require('app')
  .controller('SetupServerModalController', SetupServerModalController);

function SetupServerModalController (
  $scope,
  $controller,
  $q,
  createNewBuild,
  $rootScope,
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  keypather,
  loading,
  loadingPromises,
  promisify,
  updateDockerfileFromState,
  fetchDockerfileFromSource,
  $log,
  cardInfoTypes,
  OpenItems,
  fetchStackInfo,
  ModalService,
  data,
  actions,
  close
) {
  var SMC = this; // Server Modal Controller (shared with EditServerModalController)

  angular.extend(SMC, $controller('ServerModalController as SMC', { $scope: $scope }));

  // This needs to go away soon.
  $scope.data = data;
  loadingPromises.clear(SMC.name);
  loading.reset(SMC.name);
  var mainRepoContainerFile = new cardInfoTypes.MainRepository();

  // Set initial state
  angular.extend(SMC, {
    name: 'setupServerModal',
    isLoading: $rootScope.isLoading,
    portsSet: false,
    isNewContainer: true,
    openItems: new OpenItems(),
    getElasticHostname: function () {
      if (keypather.get(SMC, 'state.repo.attrs')) {
        // NOTE: Is SMC the best way to get the hostname?
        var repo = SMC.state.repo;
        var repoName = repo.attrs.name;
        var repoOwner = repo.attrs.owner.login.toLowerCase();
        var domain = SMC.state.repo.opts.userContentDomain;
        // NOTE: How can I know whether it will be staging or not?
        var hostname = repoName + '-staging-' + repoOwner + '.' + domain;
        return hostname;
      }
      return '';
    },
    state: {
      advanced: false,
      containerFiles: [
        mainRepoContainerFile
      ],
      mainRepoContainerFile: mainRepoContainerFile,
      ports: [],
      packages: new cardInfoTypes.Packages(),
      promises: {},
      opts: {
        masterPod: true,
        name: '',
        env: []
      },
      selectedStack: null,
      step: 1
    },
    actions: angular.extend(actions, {
      close: function () {
        if (SMC.instance) {
          return SMC.actions.deleteServer(SMC.instance, 'confirmDiscardServerView')
            .then(function (confirmed) {
              if (confirmed) {
                close();
              }
            });
        }
        if (SMC.state.repo) {
          return SMC.actions.closeWithConfirmation();
        }
        return close();
      },
      closeWithConfirmation: function () {
        $rootScope.$broadcast('close-popovers');
          ModalService.showModal({
            controller: 'ConfirmationModalController',
            controllerAs: 'CMC',
            templateUrl: 'confirmCloseEditServer'
          })
            .then(function (modal) {
              modal.close.then(function (confirmed) {
                if (confirmed) {
                  close();
                }
              });
            })
            .catch(errs.handler);
      },
    }),
    data: data,
    selectedTab: 'repository'
  });

  fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
    .then(function (repoList) {
      SMC.data.githubRepos = repoList;
      SMC.data.githubRepos.models.forEach(function (repo) {
         repo.isAdded = SMC.isRepoAdded(repo);
      });
    })
    .catch(errs.handler)
    .finally(function () {
      SMC.loading = false;
    });

  $scope.$watchCollection(function () {
    return SMC.state.ports;
  }, function (newPortsArray, oldPortsArray) {
    if (!angular.equals(newPortsArray, oldPortsArray)) {
      // Only update the Dockerfile if the ports have actually changed
      updateDockerfileFromState(SMC.state, true, true);
    }
  });

  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  SMC.isRepoAdded = function (repo) {
    // Since the newServers may have faked repos (just containing names), just check the name
    var instances = keypather.get(SMC, 'data.instances');
    if (!instances) {
      return false;
    }
    return !!instances.find(function (instance) {
      var repoName = instance.getRepoName();
      if (repoName) {
        return repo.attrs.name === repoName;
      } else {
        return normalizeRepoName(repo) === instance.attrs.name;
      }
    });
  };

  SMC.goToNextStep = function () {
    SMC.state.step += 1;
    // Update step in setup-confirm-button directive
    if (SMC.state.step === 2) {
      SMC.changeTab('commands');
    }
    else if (SMC.state.step === 3) {
      loading(SMC.name, true);
      return loadAllOptions() // When stack is selected, load dockerfile, etc
        .then(function () {
          SMC.changeTab(null);
          loading(SMC.name, false);
        });
    }
    else if (SMC.state.step === 4) {
      SMC.isBuilding = true; // `isBuilding` is used for adding spinner to 'Start Build' button
      loading(SMC.name, true);
      return SMC.createServer()
        .then(function () {
          // Go on to step 4 (logs)
          loading(SMC.name, false);
          SMC.isBuilding = false;
          loadingPromises.clear(SMC.name);
          SMC.changeTab('logs');
        });
    } else if (SMC.state.step > 4) {
      if (SMC.isDirty()) {
        // If the state, is dirty save it as we would in the EditServerModalController
        return SMC.getUpdatePromise();
      } else {
        return close();
      }
    }
  };

  function loadPorts () {
    var portsStr = keypather.get(SMC, 'state.selectedStack.ports');
    if (typeof portsStr === 'string') {
      portsStr = portsStr.replace(/,/gi, '');
      var ports = (portsStr || '').split(' ');
      // After initially adding ports here, `ports` can no longer be
      // added/removed since these will be managed by the `ports-form` directive
      // and will get overwritten if a port is added/removed.
      return ports;
    }
    return [];
  }

  function loadAllOptions() {
    if (Array.isArray(SMC.state.ports) && SMC.state.ports.length === 0) {
      SMC.state.ports = loadPorts();
    }
    // Populate ports at when stack has been selected
    return fetchDockerfileFromSource(SMC.state.selectedStack.key)
      .then(function () {
        return updateDockerfileFromState(SMC.state, true, true);
      })
      .then(function () {
        return SMC.openItems.updateAllFiles();
      })
      .then(function () {
        return SMC.openDockerfile(SMC.state, SMC.openItems);
      });
  }

  SMC.rebuild = function (noCache) {
    loading(SMC.name, true);
    return SMC.rebuildAndOrRedeploy(noCache)
      .then(function () {
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, false);
      })
      .then(function (whatIsThis) {
        return SMC;
      })
      .catch(function (err) {
        // NOTE: Reset the context version?
        errs.handler(err);
      })
      .finally(function () {
        loadingPromises.clear(SMC.name);
        loading(SMC.name, false);
      });
  };

  SMC.changeTab = function (tabname) {
    $scope.$broadcast('updateStep', SMC.state.step);
    SMC.selectedTab = tabname;
  };

  SMC.areStackAndVersionSelected = function () {
    return !!(SMC.state.selectedStack && SMC.state.selectedStack.selectedVersion);
  };

  SMC.createServer = function () {
    var createPromise = loadingPromises.finished(SMC.name)
      .then(function () {
        if (!SMC.state.advanced) {
          return updateDockerfileFromState(SMC.state, false, true);
        }
        return true;
      })
      .then(function () {
        if (SMC.state.acv.attrs.branch !== SMC.state.branch.attrs.name) {
          return promisify(SMC.state.acv, 'update')({
            repo: SMC.state.repo.attrs.full_name,
            branch: SMC.state.branch.attrs.name,
            commit: SMC.state.branch.attrs.commit.sha
          });
        }
      })
      .then(function () {
        return SMC.state;
      });

    // We need to make sure that ports are loaded when the server is created
    if (Array.isArray(SMC.state.ports) && SMC.state.ports.length === 0) {
      SMC.state.ports = loadPorts();
    }
    return SMC.openItems.updateAllFiles()
      .then(function () {
        return SMC.actions.createAndBuild(createPromise, SMC.state.opts.name);
      })
      .then(function (instance) {
        SMC.instance = instance;
        SMC.state.instance = instance;
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, false);
      })
      .then(function () {
        return SMC;
      })
      .catch(function (err) {
        errs.handler(err);
      });
  };

  SMC.createServerAndClose = function () {
    close();
    return SMC.createServer();
  };

  SMC.selectRepo = function (repo) {
    if (SMC.repoSelected) { return; }
    SMC.state.mainRepoContainerFile.name = repo.attrs.name;
    SMC.repoSelected = true;
    repo.loading = true;
    // Replace any non-word character with a -
    SMC.state.opts.name = normalizeRepoName(repo);
    return SMC.fetchStackData(repo)
      .then(function () {
        return createNewBuild($rootScope.dataApp.data.activeAccount);
      })
      .then(function (buildWithVersion) {
        SMC.state.build = buildWithVersion;
        SMC.state.contextVersion = buildWithVersion.contextVersion;
        SMC.state.advanced = false;
        SMC.state.promises.contextVersion = $q.when(buildWithVersion.contextVersion);
        return promisify(repo, 'fetchBranch')(repo.attrs.default_branch);
      })
      .then(function (masterBranch) {
        SMC.state.branch = masterBranch;
        // Set the repo here so the page change happens after all of these fetches
        return promisify(SMC.state.contextVersion.appCodeVersions, 'create', true)({
          repo: repo.attrs.full_name,
          branch: masterBranch.attrs.name,
          commit: masterBranch.attrs.commit.sha
        });
      })
      .then(function () {
        SMC.state.acv = SMC.state.contextVersion.getMainAppCodeVersion();
        SMC.state.repo = repo;
      })
      .catch(errs.handler)
      .finally(function () {
        repo.loading = false;
        SMC.repoSelected = false;
      });
  };

  SMC.fetchStackData = function (repo) {
    function setStackSelectedVersion(stack, versions) {
      if (versions[stack.key]) {
        stack.suggestedVersion = versions[stack.key];
      }
      if (stack.dependencies) {
        stack.dependencies.forEach(function (childStack) {
          setStackSelectedVersion(childStack, versions);
        });
      }
    }
    return fetchStackInfo()
      .then(function (stacks) {
        return fetchStackAnalysis(repo.attrs.full_name)
          .then(function (data) {
            if (!data.languageFramework) {
              $log.warn('No language detected');
              return;
            }
            if (data.languageFramework === 'ruby_ror') {
              data.languageFramework = 'rails';
            }
            repo.stackAnalysis = data;

            var stack = stacks.find(hasKeypaths({
              'key': data.languageFramework.toLowerCase()
            }));
            if (stack) {
              setStackSelectedVersion(stack, data.version);
              return stack;
            }
          });
      });
  };

  SMC.getUpdatePromise = function () {
    loading(SMC.name, true);
    return SMC.saveInstanceAndRefreshCards()
      .then(function () {
         return close();
      })
      .catch(function (err) {
        errs.handler(err);
        return SMC.resetStateContextVersion(SMC.state.contextVersion, true);
      })
      .finally(function () {
        loading(SMC.name, false);
      });
  };

}
