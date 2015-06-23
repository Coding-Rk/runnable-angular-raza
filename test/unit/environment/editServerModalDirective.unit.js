'use strict';

describe('editServerModalDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
  var $q;

  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var sourceMocks = runnable.newContexts(require('../../unit/apiMocks/sourceContexts'), {noStore: true});
  var apiMocks = require('../apiMocks/index');
  var mockUserFetch = new (require('../fixtures/mockFetch'))();

  var MockFetch = require('../fixtures/mockFetch');
  beforeEach(function () {
    ctx = {};
  });
  function setup(scope) {

    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      },
      oauthId: function () {
        return 'org1';
      },
      createBuild: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, ctx.build);
        });
        return ctx.build;
      })
    };
    ctx.eventTracking = {
      triggeredBuild: sinon.spy()
    };
    ctx.fetchDockerfileFromSourceMock = new MockFetch();
    ctx.populateDockerfile = new MockFetch();
    runnable.reset(apiMocks.user);

    ctx.openItemsMock = function () {
      this.models = [];
      this.add = sinon.spy();
    };

    angular.mock.module('app', function ($provide) {
      $provide.factory('helpCards', helpCardsMock.create(ctx));
      $provide.value('OpenItems', ctx.openItemsMock);
      $provide.value('findLinkedServerVariables', sinon.spy());
      $provide.value('cardInfoTypes', {});
      $provide.value('eventTracking', ctx.eventTracking);
      $provide.value('configAPIHost', '');
      $provide.factory('fetchUser', mockUserFetch.autoTrigger(ctx.fakeOrg1));
      $provide.value('uploadFile', sinon.spy());

      $provide.factory('fetchStackInfo', function ($q) {
        return function () {
          return $q.when({"languageFramework":"nodejs","version":{"nodejs":"0.10.35","npm":"0.2.0"},"serviceDependencies":[]});
        };
      });
      $provide.factory('fetchContexts', function ($q) {
        return function () {
          return $q.when(sourceMocks);
        };
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        return function () {
          return $q.when([]);
        };
      });
      $provide.factory('parseDockerfileForCardInfoFromInstance', function ($q) {
        return function () {
          return $q.when({
            ports: '80 900 90',
            startCommand: 'hello',
            containerFiles: [],
            selectedStack: {
              hello: 'cheese'
            }
          });
        };
      });

      $provide.factory('serverStatusCardHeaderDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      // Yah, I'm mocking this out. Too many templates are being loaded
      $provide.factory('ngIncludeDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('stackSelectorFormDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('repositoryFormDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('translationRulesDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });

      ctx.loadingPromiseFinishedValue = 0;

      $provide.factory('fetchDockerfileFromSource', ctx.fetchDockerfileFromSourceMock.fetch());
      $provide.factory('populateDockerfile', ctx.populateDockerfile.fetch());
      $provide.factory('loadingPromises', function ($q) {
        ctx.loadingPromiseMock = {
          add: sinon.spy(function (namespace, promise) {
            return promise;
          }),
          clear: sinon.spy(),
          finished: sinon.spy(function () {
            return $q.when(ctx.loadingPromiseFinishedValue);
          })
        };
        return ctx.loadingPromiseMock;
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _keypather_,
      _$httpBackend_,
      _$templateCache_,
      _$q_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $q = _$q_;
    });
    $scope.defaultActions = {
      close: sinon.spy()
    };
    $scope.stateModel = 'hello';

    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    ctx.template = directiveTemplate.attribute('edit-server-modal', {
      'instance': 'currentModel',
      'selected-tab': 'stateModel',
      'modal-actions': 'defaultActions'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    $scope.$digest();
  }

  beforeEach(function () {
    ctx.instance = runnable.newInstance(
      apiMocks.instances.running,
      {noStore: true}
    );
    sinon.stub(ctx.instance, 'update', function (opts, cb) {
      return cb();
    });
    sinon.stub(ctx.instance, 'getElasticHostname', function () {
      return '';
    });
    sinon.stub(ctx.instance, 'redeploy', function (cb) {
      return cb();
    });
    ctx.contextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.running
    );
    ctx.contextVersion.appCodeVersions.models = [
      {
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion
      }
    ];
    ctx.newContextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.setup
    );
    ctx.newContextVersion.appCodeVersions.models = [
      {
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion
      }
    ];
    sinon.stub(ctx.contextVersion, 'deepCopy', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });

    ctx.instance.contextVersion = ctx.contextVersion;

    ctx.dockerfile = {
      attrs: apiMocks.files.dockerfile
    };
    sinon.stub(ctx.newContextVersion, 'fetch', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });
    sinon.stub(ctx.newContextVersion, 'fetchFile', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.dockerfile);
      });
      return ctx.dockerfile;
    });
    sinon.stub(ctx.newContextVersion, 'update', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });
    ctx.build = apiClientMockFactory.build(runnable, apiMocks.contextVersions.running);
    sinon.stub(ctx.build, 'build', function (opts, cb) {
      return cb();
    });
  });
  describe('getUpdatePromise', function () {
    describe('basic mode', function () {
      beforeEach(function () {
        setup({
          currentModel: ctx.instance,
          selectedTab: 'env'
        });
      });
      it('should do nothing if nothing has changed', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        sinon.assert.notCalled(ctx.newContextVersion.fetchFile);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.notCalled(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });

      it('should only update the instance when only envs have changed', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        sinon.assert.notCalled(ctx.newContextVersion.fetchFile);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.calledOnce(ctx.instance.redeploy);
      });

      it('should build when promises have been made', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        $scope.$digest();
        sinon.assert.notCalled(ctx.newContextVersion.fetchFile);
        $scope.$digest();
        sinon.assert.notCalled(ctx.fetchDockerfileFromSourceMock.getFetchSpy());
        sinon.assert.notCalled(ctx.populateDockerfile.getFetchSpy());
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        $scope.$digest();
        expect($elScope.state.opts.build).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
      it('should create dockerfile when ports change', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;

        keypather.set($elScope, 'portTagOptions.tags.tags', {0: '123'});
        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        $scope.$digest();
        $scope.$digest();
        //sinon.assert.calledOnce(ctx.newContextVersion.fetchFile);
        ctx.fetchDockerfileFromSourceMock.triggerPromise({attrs: 'dockerfile'});
        $scope.$digest();
        sinon.assert.calledOnce(ctx.fetchDockerfileFromSourceMock.getFetchSpy());
        ctx.populateDockerfile.triggerPromise({attrs: 'dockerfile'});
        $scope.$digest();
        sinon.assert.calledOnce(ctx.populateDockerfile.getFetchSpy());
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        $scope.$digest();
        expect($elScope.state.opts.build).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
    });
    describe('advanced mode', function () {
      beforeEach(function () {
        setup({
          currentModel: ctx.instance,
          selectedTab: 'env'
        });
        ctx.contextVersion.attrs.advanced = true;
      });
      it('should only update the instance when only envs have changed', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.calledOnce(ctx.instance.redeploy);
      });
    });
  });
  describe('advanced flag', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance
      });
    });
    it('should save the change immediately', function () {
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);

      $scope.$digest();
      ctx.loadingPromiseMock.add.reset();
      sinon.assert.notCalled(ctx.loadingPromiseMock.add);
      expect($elScope.state.advanced).to.not.be.ok;
      $elScope.state.advanced = true;
      $scope.$digest();

      sinon.assert.called(closePopoverSpy);
      sinon.assert.called(ctx.loadingPromiseMock.add);
      $scope.$digest();
      sinon.assert.called(ctx.newContextVersion.fetchFile);
      sinon.assert.called(ctx.loadingPromiseMock.add);
      sinon.assert.calledWith(ctx.newContextVersion.update, {
        advanced: true
      });
    });
  });

  describe('change Tab', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance
      });
    });
    it('should navigate since everything is ok', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {
        selectedVersion: 'adsfasdfsdf'
      });
      keypather.set($elScope, 'state.startCommand', 'adsasdasd');

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('files');
    });
    it('should navigate to stack since it has errors', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {});
      keypather.set($elScope, 'state.startCommand', 'adsasdasd');

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('stack');
    });
    it('should navigate to stack since it has errors', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {});
      keypather.set($elScope, 'state.startCommand', 'adsasdasd');

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('stack');
    });
    it('should navigate to repositories since it has errors', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {
        selectedVersion: 'adsfasdfsdf'
      });
      keypather.set($elScope, 'state.startCommand', null);

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('repository');
    });

    it('should navigate fine with advanced mode', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', true);
      // Digest here since the state.advanced change will trigger a change
      $scope.$digest();
      keypather.set($elScope, 'state.selectedStack', {});
      keypather.set($elScope, 'state.startCommand', null);

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('files');
    });
  });
});
