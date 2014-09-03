module.exports = [{
  state: 'home',
  abstract: false,
  url: '^/',
  templateUrl: 'viewHome',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'width-full': true
    },
  }
}, {
  state: 'projects',
  abstract: false,
  url: '^/new',
  templateUrl: 'viewProjectLayout',
  controller: 'ControllerProjectLayout'
}, {
  state: 'projects.setup',
  abstract: false,
  url: '^/new/:userName/:projectName',
  templateUrl: 'viewSetup',
  controller: 'ControllerSetup',
  data: {
    bodyClass: {
      setup: true
    },
  }
}, {
  state: 'projects.buildList',
  abstract: false,
  url: '^/project/:userName/:projectName/:branchName',
  templateUrl: 'viewBuildList',
  controller: 'ControllerBuildList'
}, {
  state: 'projects.build',
  abstract: false,
  url: '^/project/:userName/:projectName/:branchName/:buildName',
  templateUrl: 'viewBuild',
  controller: 'ControllerBuild'
}, {
  state: 'projects.buildNew',
  abstract: false,
  url: '^/project/:userName/:projectName/:branchName/:buildName/fork/:newBuildName',
  templateUrl: 'viewBuildNew',
  controller: 'ControllerBuildNew'
}, {
  state: 'projects.instance',
  abstract: false,
  url: '^/instances/:userName/:instanceId',
  templateUrl: 'viewInstance',
  controller: 'ControllerInstance'
}, {
  state: '404',
  abstract: false,
  templateUrl: 'viewError',
  controller: 'ControllerError'
}, {
  state: 'box',
  abstract: true,
  templateUrl: 'viewBoxLayout',
  controller: 'ControllerBoxLayout'
}, {
  state: 'box.instance',
  abstract: false,
  url: '^/box/:shortHash',
  templateUrl: 'viewBoxInstance',
  controller: 'ControllerBoxInstance'
}, {
  state: 'box.editInstance',
  abstract: false,
  url: '^/box/:shortHash/edit/:buildId',
  templateUrl: 'viewBoxInstanceEdit',
  controller: 'ControllerBoxInstanceEdit'
}];
Object.freeze(module.exports);
