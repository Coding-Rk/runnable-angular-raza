'use strict';

require('app')
  .factory('setLastInstance', setLastInstance);

function setLastInstance(
  pFetchUser,
  promisify,
  errs
) {
  return function (instanceName) {
    console.log('Setting last instance', instanceName);
    return pFetchUser().then(function (user){
      return promisify(user, 'update')({
        'userOptions.uiState.previousLocation.instance': instanceName
      });
    }).catch(errs.handler);
  };
}