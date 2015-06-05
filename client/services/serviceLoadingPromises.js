'use strict';

require('app')
  .factory('loadingPromsies', loadingPromsies);

function loadingPromsies(
  $q
) {
  var promiseHash = {};

  function add (namespace, promise) {
    if (!promiseHash[namespace]) {
      promiseHash[namespace] = [];
    }
    promiseHash[namespace].push(promise);
    return promise;
  }
  function clear (namespace) {
    promiseHash[namespace] = [];
  }
  function finished (namespace) {
    return $q.all(promiseHash[namespace]);
  }

  return {
    add: add,
    clear: clear,
    finished: finished
  };
}
