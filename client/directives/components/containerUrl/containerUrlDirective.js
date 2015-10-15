'use strict';

require('app')
  .directive('containerUrl', containerUrl);

var UNAVAILABLE_OS_LIST = [
  'Android',
  'Linux armv7l',
  'iPhone',
  'iPod',
  'iPad'
];
/**
 * @ngInject
 */
function containerUrl(
  $window,
  extractInstancePorts
) {
  return {
    restrict: 'A',
    templateUrl: 'containerUrlView',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        var ports = extractInstancePorts(newValue);
        $scope.defaultPort = '';
        if (ports.length && !ports.includes('80')) {
          $scope.defaultPort = ':' + ports[0];
        }
      });
      function getModifierKey() {
        return $window.navigator.platform.toLowerCase().indexOf('mac') > -1 ? '⌘' : 'CTRL';
      }
      $scope.shouldShowCopyButton = !UNAVAILABLE_OS_LIST.includes($window.navigator.platform);

      $scope.onClipboardEvent = function (err) {
        if (err) {
          var modifier = getModifierKey();
          $scope.clipboardText = 'Press ' + modifier + '+C ' + ' to Copy';
        } else {
          $scope.clipboardText = 'Copied!';
        }
      };
    }
  };
}
