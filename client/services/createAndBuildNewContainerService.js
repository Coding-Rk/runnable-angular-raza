'use strict';

require('app')
  .factory('createAndBuildNewContainer', createAndBuildNewContainer);


function createAndBuildNewContainer(
  $q,
  $rootScope,
  createNewInstance,
  eventTracking,
  fetchInstancesByPod,
  fetchUser,
  helpCards
) {
  return function (createPromise, containerName) {
    eventTracking.triggeredBuild(false);
    // Save this in case it changes
    var cachedActiveAccount = $rootScope.dataApp.data.activeAccount;
    var instance = null;
    return $q.all({
      masterInstances: fetchInstancesByPod(cachedActiveAccount.oauthName()),
      user: fetchUser()
    })
      .then(function (response) {
        instance = response.user.newInstance({
          name: containerName,
          owner: {
            username: cachedActiveAccount.oauthName()
          }
        }, {warn: false});
        response.masterInstances.add(instance);
        return createPromise;
      })
      .then(function (newServerModel) {
        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Your new container is building.'
        });
        helpCards.hideActiveCard();
        return createNewInstance(
          cachedActiveAccount,
          newServerModel.build,
          newServerModel.opts,
          instance
        );
      })
      .then(function (instance) {
        helpCards.refreshAllCards();
        return instance;
      })
      .catch(function (err) {
        // Remove it from the servers list
        instance.dealloc();
        return $q.reject(err);
      });
  };
}