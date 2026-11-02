
async function getStoredAnnouncements(clubId) {
  const res = await apiRequest('announcements.php?club=' + encodeURIComponent(clubId))
  return res.announcements || []
}

// item: { title, date, text, imageBlob }  
async function addAnnouncement(clubId, item) {
  const form = new FormData()
  form.append('club', clubId)
  form.append('title', item.title || '')
  form.append('date', item.date || '')
  form.append('text', item.text || '')
  if (item.imageBlob) form.append('image', item.imageBlob, 'announcement.jpg')
  return apiRequest('announcement_create.php', { method: 'POST', form })
}

async function deleteAnnouncement(id) {
  return apiRequest('announcement_delete.php', { method: 'POST', data: { id } })
}


async function getClubMembers(clubId) {
  const res = await apiRequest('members.php?club=' + encodeURIComponent(clubId))
  return res.members || []
}


function isAdminFor(clubId) {
  return APP_IS_ADMIN || APP_OFFICER_CLUBS.includes(clubId)
}

function manageableClubs() {
  return Object.keys(CLUBS).filter(isAdminFor)
}

function formatAnnouncementDate(value) {
  if (!value) return ''
  const d = new Date(value + 'T00:00:00')
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
