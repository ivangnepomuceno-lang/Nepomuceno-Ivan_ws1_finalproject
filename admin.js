appReady.then(async () => {
  
  if (!requireLogin()) return

  const aStatus = document.getElementById('form-status')
  const aDenied = document.getElementById('admin-denied')
  const tabAnnounce = document.getElementById('tab-announce')
  const aClub = document.getElementById('a-club')
  const aImage = document.getElementById('a-image')
  const aPreview = document.getElementById('a-preview')
  const aList = document.getElementById('posted-list')
  const aForm = document.getElementById('admin-form')
  const textInput = document.getElementById('a-text')
  const membersBox = document.getElementById('members-list')
  const postBtn = aForm.querySelector('.submit-btn')

  const pad = n => String(n).padStart(2, '0')
  const todayStr = () => {
    const t = new Date()
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
  }
  const say = (text, ok) => {
    aStatus.classList.toggle('success', !!ok)
    aStatus.textContent = text || ''
  }

  // Paliitin ang picture bago i-upload (mas mabilis, mas maliit sa server)
  const compress = (file, maxSize = 900, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Could not read the picture'))
      reader.onload = () => {
        const img = new Image()
        img.onerror = () => reject(new Error('This file is not a valid picture'))
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process the picture')), 'image/jpeg', quality)
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    })

  const clubsToManage = manageableClubs()

  if (clubsToManage.length === 0) {
    aDenied.hidden = false
    aDenied.textContent =
      'Your account (' + (APP_USER && APP_USER.email ? APP_USER.email : 'unknown') +
      ') is not an admin. To use this page, add your email to ADMIN_EMAILS (or CLUB_OFFICERS) in api/config.php, then log in again.'
    return
  }

  tabAnnounce.hidden = false

  clubsToManage.forEach(id => {
    const opt = document.createElement('option')
    opt.value = id
    opt.textContent = CLUBS[id].name
    aClub.appendChild(opt)
  })
  const wanted = new URLSearchParams(location.search).get('club')
  if (wanted && clubsToManage.includes(wanted)) aClub.value = wanted
  document.getElementById('a-date').value = todayStr()

  const applyAccent = () => {
    const club = CLUBS[aClub.value]
    document.documentElement.style.setProperty('--accent', (club && club.color) || '#38b6ff')
  }

  const emptyNote = (box, text) => {
    box.replaceChildren()
    const p = document.createElement('p')
    p.className = 'posted-empty'
    p.textContent = text
    box.appendChild(p)
  }

  const renderList = async () => {
    emptyNote(aList, 'Loading...')
    let items = []
    try {
      items = await getStoredAnnouncements(aClub.value)
    } catch (err) {
      emptyNote(aList, err.message)
      return
    }
    if (items.length === 0) {
      emptyNote(aList, 'No announcements posted yet for this club.')
      return
    }
    aList.replaceChildren()
    items.forEach(a => {
      const row = document.createElement('div')
      row.className = 'posted-row'
      if (a.image) {
        const img = document.createElement('img')
        img.src = a.image
        img.alt = ''
        row.appendChild(img)
      }
      const info = document.createElement('div')
      info.className = 'posted-info'
      const title = document.createElement('strong')
      title.textContent = a.title || (a.text || '').slice(0, 50) || 'Announcement'
      const meta = document.createElement('span')
      meta.textContent = formatAnnouncementDate(a.date)
      info.append(title, meta)

      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'posted-del'
      del.textContent = 'Delete'
      del.addEventListener('click', async () => {
        if (!confirm('Delete this announcement?')) return
        try {
          await deleteAnnouncement(a.id)
          renderList()
        } catch (err) {
          say(err.message)
        }
      })
      row.append(info, del)
      aList.appendChild(row)
    })
  }

  
  const renderMembers = async () => {
    emptyNote(membersBox, 'Loading...')
    let members = []
    try {
      members = await getClubMembers(aClub.value)
    } catch (err) {
      emptyNote(membersBox, err.message)
      return
    }
    if (members.length === 0) {
      emptyNote(membersBox, 'No members yet.')
      return
    }
    membersBox.replaceChildren()

    const wrap = document.createElement('div')
    wrap.className = 'table-wrap'
    const table = document.createElement('table')
    table.className = 'members-table'

    const head = table.createTHead().insertRow()
    ;['Name', 'Student ID', 'Course', 'Year / Section', 'Mobile', 'Team', 'Joined'].forEach(t => {
      const th = document.createElement('th')
      th.textContent = t
      head.appendChild(th)
    })

    const body = table.createTBody()
    members.forEach(m => {
      const row = body.insertRow()
      const joined = new Date(m.joinedAt)
      ;[
        m.fullname,
        m.studentId,
        m.course,
        m.year + ' / ' + m.section,
        m.contact,
        m.team || '-',
        isNaN(joined) ? '' : joined.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      ].forEach(v => {
        row.insertCell().textContent = v
      })
    })

    wrap.appendChild(table)
    const count = document.createElement('p')
    count.className = 'posted-note'
    count.textContent = members.length + (members.length === 1 ? ' member' : ' members')
    membersBox.append(count, wrap)
  }

  const refreshAll = () => { applyAccent(); renderList(); renderMembers() }
  aClub.addEventListener('change', refreshAll)
  refreshAll()

  // ---------- Picture ----------
  let imageBlob = null

  aImage.addEventListener('change', async () => {
    imageBlob = null
    aPreview.hidden = true
    const file = aImage.files[0]
    if (!file) return
    try {
      imageBlob = await compress(file)
      aPreview.src = URL.createObjectURL(imageBlob)
      aPreview.hidden = false
    } catch (err) {
      say(err.message)
      aImage.value = ''
    }
  })

  textInput.addEventListener('input', () => {
    textInput.closest('.field').classList.remove('incorrect')
    textInput.closest('.field').querySelector('.field-error').textContent = ''
  })

  // ---------- Post ----------
  aForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    say('')

    const text = textInput.value.trim()
    const field = textInput.closest('.field')
    if (!text) {
      field.classList.add('incorrect')
      field.querySelector('.field-error').textContent = 'Please write the announcement'
      return
    }

    postBtn.disabled = true
    try {
      await addAnnouncement(aClub.value, {
        title: document.getElementById('a-title').value.trim(),
        date: document.getElementById('a-date').value,
        text: text,
        imageBlob: imageBlob
      })
    } catch (err) {
      say(err.message)
      postBtn.disabled = false
      return
    }

    say('Posted! It now shows on the ' + (CLUBS[aClub.value] ? CLUBS[aClub.value].short : '') + ' club page.', true)
    const keep = aClub.value
    aForm.reset()
    aClub.value = keep
    document.getElementById('a-date').value = todayStr()
    imageBlob = null
    aPreview.hidden = true
    postBtn.disabled = false
    renderList()
  })
}).catch(err => {
  console.error(err)
  const s = document.getElementById('form-status')
  if (s) s.textContent = 'Error: ' + err.message
})
