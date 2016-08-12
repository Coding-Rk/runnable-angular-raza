'use strict';

describe('directiveAccountsSelect'.bold.underline.blue, function() {
  var $scope, $elScope;
  var $rootScope;
  var ctx;
  var $timeout;
  var apiMocks = require('../apiMocks/index');

  beforeEach(function () {
    ctx = {};
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      },
      gravitar: function () {
        return true;
      },
      newSettings: sinon.spy(function() {
        return {
          update: sinon.spy()
        };
      }),
      fetchSettings: sinon.spy(),
      isInTrial: sinon.stub().returns(true),
      trialRemaining: sinon.stub().returns(2),
      isInActivePeriod: sinon.stub().returns(false),
      isInGrace: sinon.stub(),
      isGraceExpired: sinon.stub(),
      graceRemaining: sinon.stub()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      },
      gravitar: function () {
        return true;
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      },
      gravitar: function () {
        return true;
      }
    };
    var addToScope =  {
      data: {
        activeAccount: ctx.fakeuser,
        orgs: {models: [ctx.fakeOrg1, ctx.fakeOrg2]},
        user: ctx.fakeuser
      }
    };

    angular.mock.module('app');
    ctx.stateMock = {
      '$current': {
        name: 'instance.instanceEdit'
      },
      params: {
        userName: 'username',
        instanceName: 'instanceName'
      },
      go: function () {}
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('$state', ctx.stateMock);
      $provide.value('$stateParams', {
        userName: 'username',
        instanceName: 'instanceName'
      });
    });
    angular.mock.inject(function($compile, _$rootScope_, _$timeout_){
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;

      var tpl = directiveTemplate.attribute('accounts-select', {
        'data': 'data'
      });

      Object.keys(addToScope).forEach(function (key) {
        $scope[key] = addToScope[key];
      });

      ctx.element = $compile(tpl)($scope);
      $scope.$digest();
    });
    $elScope = ctx.element.isolateScope();
  });

  describe('directive logic'.bold.blue, function() {
    it('should emit signal and change state on account change', function (done) {
      ctx.stateMock.go = sinon.spy(function (location, state) {
        expect(state).to.deep.equal({
          userName: ctx.fakeOrg1.oauthName()
        });
        done();
      });
      var instanceFetchSpy = sinon.spy(function (event, username) {
        expect(username).to.equal(ctx.fakeOrg1.oauthName());
      });
      $rootScope.$on('INSTANCE_LIST_FETCH', instanceFetchSpy);
      $scope.$digest();
      $elScope.popoverAccountMenu.actions.selectActiveAccount(ctx.fakeOrg1);
      $scope.$apply();
      $timeout.flush();
      expect($scope.data.activeAccount).to.equal(ctx.fakeOrg1);
    });
  });

  describe('getBadgeCount', function () {
    describe('when in trial', function () {
      beforeEach(function () {
        ctx.fakeuser.isInTrial.returns(true);
        ctx.fakeuser.trialRemaining = sinon.stub().returns(12);
      });
      it('should return trial remaining', function () {
        ctx.fakeuser.isInTrial.reset();
        ctx.fakeuser.trialRemaining.reset();
        expect($elScope.getBadgeCount()).to.equal(12);
        sinon.assert.calledOnce(ctx.fakeuser.isInTrial);
        sinon.assert.calledOnce(ctx.fakeuser.trialRemaining);
      });
    });

    describe('when in grace', function () {
      beforeEach(function () {
        ctx.fakeuser.isInTrial.returns(false);
        ctx.fakeuser.isInGrace.returns(true);
        ctx.fakeuser.graceRemaining.returns(2);
      });
      it('should return grace remaining', function () {
        ctx.fakeuser.isInGrace.reset();
        ctx.fakeuser.graceRemaining.reset();
        ctx.fakeuser.trialRemaining.reset();
        expect($elScope.getBadgeCount()).to.equal(2);
        sinon.assert.calledOnce(ctx.fakeuser.isInGrace);
        sinon.assert.calledOnce(ctx.fakeuser.graceRemaining);
        sinon.assert.notCalled(ctx.fakeuser.trialRemaining);
      });
    });

    describe('when in grace expired', function () {
      beforeEach(function () {
        ctx.fakeuser.isInTrial.returns(false);
        ctx.fakeuser.isInGrace.returns(false);
        ctx.fakeuser.isGraceExpired.returns(true);
      });
      it('should return grace remaining', function () {
        expect($elScope.getBadgeCount()).to.equal('!');
      });
    });

    describe('when active', function () {
      beforeEach(function () {
        ctx.fakeuser.isInTrial.returns(false);
        ctx.fakeuser.isInGrace.returns(false);
        ctx.fakeuser.isGraceExpired.returns(false);
      });
      it('should return grace remaining', function () {
        expect($elScope.getBadgeCount()).to.equal('');
      });
    });
  });

  describe('getClasses', function () {
    it('should return false flags when in active period', function () {
      ctx.fakeuser.isInActivePeriod.returns(true);
      expect($elScope.getClasses()).to.deep.equal({
        badge: false,
        'badge-orange': false
      });
    });

    it('should return true flags when not in active period', function () {
      expect($elScope.getClasses()).to.deep.equal({
        badge: true,
        'badge-orange': true
      });
    });
  });
});
