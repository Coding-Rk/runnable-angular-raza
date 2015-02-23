'use strict';

var $controller,
    $rootScope,
    $timeout,
    $scope,
    $localStorage,
    keypather,
    $state,
    $q;
var apiMocks = require('../apiMocks/index');
var mockFetch = new (require('../fixtures/mockFetch'))();
/**
 * Things to test:
 * Since this controller is pretty simple, we only need to test it's redirection
 */
describe('ControllerInstanceHome'.bold.underline.blue, function () {
  var ctx = {};

  function setup(activeAccountUsername) {
    mockFetch.clearDeferer();
    angular.mock.module('app');
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      }
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      }
    };

    ctx.userList = {
      user: ctx.fakeuser,
      org1: ctx.fakeOrg1,
      org2: ctx.fakeOrg2
    };

    ctx.stateParams = {
      userName: activeAccountUsername || 'user'
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchInstances', mockFetch.fetch());
    });
    angular.mock.inject(function (_$controller_,
                                  _$rootScope_,
                                  _$localStorage_,
                                  _keypather_,
                                  _$timeout_,
                                  _$state_,
                                  _$q_) {
      keypather = _keypather_;
      $q = _$q_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $localStorage = _$localStorage_;
      $timeout = _$timeout_;
      $state = _$state_;
    });

    if (activeAccountUsername) {
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList[activeAccountUsername]);
    }

    ctx.fakeGo = sinon.stub($state, 'go');
    var ca = $controller('ControllerInstanceLayout', {
      '$scope': $scope,
      '$rootScope': $rootScope,
      '$state': $state,
      '$stateParams': ctx.stateParams
    });
    $rootScope.$digest();
  }

  it('basic', function () {

    setup('user');
    $rootScope.$digest();

    expect($scope).to.have.property('dataInstanceLayout');
    expect($scope).to.have.deep.property('dataInstanceLayout.actions');
    expect($scope).to.have.deep.property('dataInstanceLayout.data');
    expect($scope).to.have.deep.property('dataInstanceLayout.state');
    expect($scope).to.have.deep.property('dataInstanceLayout.data.logoutURL');
    $rootScope.$digest();
    expect($rootScope.dataApp.state.loadingInstances).to.be.true;
    expect($rootScope.dataApp.data.instances).to.be.null;
    var many = runnable.newInstances(
      [apiMocks.instances.running, apiMocks.instances.stopped],
      {noStore: true}
    );
    many.githubUsername = 'user';
    mockFetch.triggerPromise(many);
    $rootScope.$digest();
    $scope.$apply();
    expect($rootScope.dataApp.state.loadingInstances).to.be.false;
    expect($rootScope.dataApp.data.instances).to.equal(many);

    $scope.$apply();
    $scope.$destroy();

  });
  describe('event trigger'.blue, function() {

    it('no username', function () {

      setup('user');
      $rootScope.$digest();
      var many = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.githubUsername = 'user';
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      $scope.$apply();
      expect($rootScope.dataApp.state.loadingInstances).to.be.false;
      expect($rootScope.dataApp.data.instances).to.equal(many);

      $rootScope.$broadcast('INSTANCE_LIST_FETCH');
      $rootScope.$digest();

      expect($rootScope.dataApp.state.loadingInstances).to.not.be.ok;
      expect($rootScope.dataApp.data.instances).to.be.ok;

      $scope.$apply();

    });
    it('new user', function () {

      setup('org1');
      $rootScope.$digest();

      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList.org2);
      $rootScope.$broadcast('INSTANCE_LIST_FETCH', 'org2');
      $rootScope.$digest();
      expect($rootScope.dataApp.state.loadingInstances).to.be.true;
      expect($rootScope.dataApp.data.instances).to.be.null;
      var many = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.githubUsername = 'org2';
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      $scope.$apply();
      expect($rootScope.dataApp.state.loadingInstances).to.be.false;
      expect($rootScope.dataApp.data.instances).to.equal(many);


    });
  });

});