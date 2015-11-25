'use strict';

require('app')
  .controller('InviteModalController', InviteModalController);

/**
 * @ngInject
 */
function InviteModalController(
  $q,
  fetchUser,
  fetchGithubOrgId,
  promisify,
  errs,
  teamName,
  unInvitedMembers,
  close
) {
  var IMC = this;
  angular.extend(IMC, {
    unInvitedMembers: unInvitedMembers,
    activeUserIndex: null,
    sendingInviteUserIndex: null,
    sending: false,
    close: close
  });

  IMC.sendInvitation = function (user, userIndex) {
    IMC.sendingInviteUserIndex = userIndex;
    IMC.activeUserIndex = null;
    IMC.sendingInvitation = true;
    $q.all({
      user: fetchUser(),
      githubOrgId: fetchGithubOrgId(teamName)
    })
    .then(function (response) {
      return promisify(response.user, 'createTeammateInvitation')({
        organization: {
          github: response.githubOrgId
        },
        recipient: {
          email: user.inviteEmail,
          github: user.id
        }
      });
    })
    .then(function (invitation) {
      user.inviteSent = true;
      IMC.sendingInvitation = false;
      IMC.sendingInviteUserIndex = null;
    })
    .catch(function (err) {
      errs.handler(err);
      IMC.sendingInvitation = false;
      IMC.sendingInviteUserIndex = null;
    });
  };

  IMC.setActiveItem = function (userIndex) {
    IMC.activeUserIndex = userIndex;
  };
}
