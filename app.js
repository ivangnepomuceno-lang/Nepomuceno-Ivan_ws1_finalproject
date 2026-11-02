
const API_BASE = 'api/'


let APP_USER = null
let APP_IS_ADMIN = false
let APP_OFFICER_CLUBS = []
let APP_MEMBERSHIPS = {}
let APP_ERROR = ''

async function apiRequest(file, options = {}) {
  const opts = {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers: {}
  }
  if (options.form) {
    opts.body = options.form
  } else if (options.data) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(options.data)
  }

  let res
  try {
    res = await fetch(API_BASE + file, opts)
  } catch {
    throw new Error('Cannot reach the server. Open the site with http://localhost/icct-clubs/ and make sure Apache and MySQL are running in XAMPP.')
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('The server sent an invalid response. Open the site through XAMPP (http://localhost/icct-clubs/), not Live Server, and make sure MySQL is running.')
  }

  if (!res.ok || !json.ok) {
    const err = new Error(json.error || 'Something went wrong')
    err.status = res.status
    err.fields = json.fields || {}
    throw err
  }
  return json
}

function applySession(r) {
  APP_USER = r.user || null
  APP_IS_ADMIN = !!r.isAdmin
  APP_OFFICER_CLUBS = r.officerClubs || []
  APP_MEMBERSHIPS = r.memberships && !Array.isArray(r.memberships) ? r.memberships : {}
}


const appReady = (async () => {
  try {
    applySession(await apiRequest('me.php'))
  } catch (err) {
    APP_ERROR = err.message
  }
})()


function requireLogin() {
  if (!APP_USER) {
    window.location.href = 'login.html'
    return false
  }
  return true
}
