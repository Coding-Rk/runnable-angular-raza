'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');
var users = require('./helpers/users');

var InstancePage = require('./pages/InstancePage');
var spinner = require('./helpers/spinner');

describe('Changing commit', users.doMultipleUsers(function (username) {

  it('should allow the user to change the branch to !master', function () {
    var instance = new InstancePage('RailsProject');
    instance.get();

    browser.wait(function () {
      return instance.repoList.repoList.get().isPresent();
    });

    var repo = instance.repoList.repos.get(0);

    browser.wait(repo.isDisplayed);
    var commitMenu = instance.repoList.getCommitMenu(repo);

    commitMenu.open(repo);
    commitMenu.changeBranch('test1', 1);
    expect(instance.repoList.updateButton.get().isPresent()).toBe(false);

    waitForRepos(instance);

    repo = instance.repoList.repos.get(0);
    browser.wait(function () {
      return commitMenu.branchInfo.get().isPresent();
    });

    commitMenu.branchInfo.get().getText(function (text) {
      expect(text).toBe('test1');
    });
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.match(/Kissmetrics/);
    });
    commitMenu.open(repo);
    commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('test1');
    });
  });

  it('should allow you to change the commit in the edit modal', function () {
    var instance = new InstancePage('RailsProject');
    instance.get();
    instance.openEditModal();
    var instanceEdit = instance.modalEdit;

    browser.wait(function () {
      return instanceEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });

    browser.wait(function () {
      return instanceEdit.repoList.repoList.get().isPresent();
    });

    var repo = instance.repoList.repos.get(0);

    browser.wait(repo.isDisplayed);
    var commitMenu = instanceEdit.repoList.getCommitMenu(repo);

    commitMenu.open(repo);
    commitMenu.changeBranch('test1', 2);
    expect(instanceEdit.repoList.updateButton.get().isPresent()).toBe(false);

    instanceEdit.buildChanges();
    instance = new InstancePage('RailsProject');
    // Removing until backend fixes key issue
    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
    instance.closeNotificationIfPresent();

    instance.openEditModal();

    browser.wait(function () {
      return instance.modalEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });

    repo = instance.repoList.repos.get(0);
    browser.wait(function () {
      return commitMenu.branchInfo.get().isPresent();
    });

    commitMenu.branchInfo.get().getText(function (text) {
      expect(text).toBe('test1');
    });
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.match(/ENV VARS/);
    });
    commitMenu.open(repo);
    commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('test1');
    });
  });

  it('should allow the user to change the branch back to master', function () {
    var instance = new InstancePage('RailsProject');
    instance.get();
    browser.wait(function () {
      return instance.repoList.repoList.get().isPresent();
    });

    var repo = instance.repoList.repos.get(0);
    browser.wait(function () {
      return repo.isDisplayed();
    });
    var commitMenu = instance.repoList.getCommitMenu(repo);
    commitMenu.open(repo);
    commitMenu.changeBranch('master', 0);
    expect(instance.repoList.updateButton.get().isPresent()).toBe(false);

    waitForRepos(instance);

    repo = instance.repoList.repos.get(0);
    browser.wait(function () {
      return commitMenu.branchInfo.get().isPresent();
    });

    commitMenu.branchInfo.get().getText(function (text) {
      expect(text).toBe('master');
    });
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.match(/Update database.yml/);
    });

    commitMenu.open(repo);
    commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('master');
    });
  });

}));

function waitForRepos(instance, repo) {
  browser.wait(function () {
    return instance.repoList.repoList.get().isPresent() && instance.repoList.repoList.get().isDisplayed();
  });
}
