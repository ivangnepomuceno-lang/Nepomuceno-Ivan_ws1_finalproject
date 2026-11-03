

function membershipUser() {
  return APP_USER
}


function getMyClubs() {
  return APP_MEMBERSHIPS
}

function isMember(clubId) {
  return !!APP_MEMBERSHIPS[clubId]
}


async function joinClub(clubId, data) {
  const res = await apiRequest('join.php', {
    method: 'POST',
    data: Object.assign({ club: clubId }, data)
  })
  APP_MEMBERSHIPS[clubId] = res.membership
  return res.membership
}

async function leaveClub(clubId) {
  await apiRequest('leave.php', { method: 'POST', data: { club: clubId } })
  delete APP_MEMBERSHIPS[clubId]
}
