'use strict';

require('app')
  .factory('fetchRepoDockerfile', fetchRepoDockerfile)
  .factory('fetchRepoDockerfiles', fetchRepoDockerfiles)
  .factory('doesDockerfileExist', doesDockerfileExist)
  .factory('fetchCommitsForFile', fetchCommitsForFile)
  .factory('fetchDockerfileForContextVersion', fetchDockerfileForContextVersion);

function fetchRepoDockerfile(
  $http,
  configAPIHost
) {
  return function (repoFullName, branchName, path) {
    path = path.replace(/^\/*/, ''); // Removes 0-inf / at the start
    return $http({
      method: 'get',
      url: configAPIHost + '/github/repos/' + repoFullName + '/contents/' + path + '?ref=' + branchName
    })
      .then(function (res) {
        return res ? res.data : null;
      });
  };
}

function fetchRepoDockerfiles(
  $q,
  doesDockerfileExist,
  fetchRepoDockerfile
) {
  return function (repoFullName, branchName, paths) {
    branchName = branchName || 'master';
    if (!paths) {
      paths = ['Dockerfile'];
    }
    var dockerfilePromises = paths.map(function (path) {
      return fetchRepoDockerfile(repoFullName, branchName, path)
        .then(doesDockerfileExist);
    });
    return $q.all(dockerfilePromises)
      .then(function (resultArray) {
        return resultArray.filter(angular.isDefined);
      });
  };
}

function doesDockerfileExist() {
  return function (file) {
    if (!file || (file.message && file.message.match(/not.found/i))) {
      return undefined;
    }
    // GH doesnt return the '/' when returning a path
    file.path = '/' + file.path;
    return file;
  };
}

function fetchDockerfileForContextVersion (
	$q,
  base64,
  doesDockerfileExist,
  fetchCommitsForFile,
  fetchRepoDockerfile,
  keypather,
  moment,
  promisify
) {
  return function (contextVersion) {
    var buildDockerfilePath = keypather.get(contextVersion, 'attrs.buildDockerfilePath');
    var acv = contextVersion.getMainAppCodeVersion();
    var repoFullName = keypather.get(acv, 'attrs.repo');
    if (buildDockerfilePath && repoFullName) {
      var branchName = keypather.get(acv, 'attrs.branch');
      // Get everything before the last '/' and add a '/' at the end
      var nestedDirs = Math.max(buildDockerfilePath.split('/').length - 2, 1);
      var nestedPathRegex = '\\/([^\\/]*)'.repeat(nestedDirs);
      var dockerfileRegex = new RegExp('^(\\/?[^\\/]*)' + nestedPathRegex + '$');
      var result = dockerfileRegex.exec(buildDockerfilePath);
      if (keypather.get(result, 'length') < 3) {
        throw new Error('BuilddockerfilePath is invalid');
      }
      var name = result && result.pop() || '';
      var path = result && result.slice(1).join('/') || '';
      // Get everything after the last '/'
      return fetchRepoDockerfile(repoFullName, branchName, buildDockerfilePath)
        .then(doesDockerfileExist)
        .then(function (dockerfile) {
          if (!dockerfile) {
            return null;
          }
          return fetchCommitsForFile(repoFullName, branchName, buildDockerfilePath)
            .then(function (commits) {
              // Fetch last time file was updated
              var lastTimeUpdated = keypather.get(commits, '[0].commit.committer.date');
              return contextVersion.newFile({
                _id: dockerfile.sha,
                id: dockerfile.sha,
                body: base64.decode(dockerfile.content),
                isRemoteCopy: true,
                name: name,
                path: path + '/',
                lastUpdated: lastTimeUpdated && moment(lastTimeUpdated).fromNow(false)
              });
            });
        });
    }
    return promisify(contextVersion, 'fetchFile')(buildDockerfilePath || '/Dockerfile');
  };
}

function fetchCommitsForFile(
  $q,
  $http,
  configAPIHost,
  keypather
) {
  return function (repoFullName, branchName, path) {
    branchName = (branchName) ? branchName : 'master';
    return $http.get(configAPIHost + '/github/repos/' + repoFullName + '/commits', {
      path: path,
      sha: branchName
    })
      .then(function (res) {
        return res.data;
      });
  };
}

