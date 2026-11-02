appReady.then(() => {
  // ---------- Protektado: dapat naka-login ----------
  if (!requireLogin()) throw new Error('not logged in')
  const joinUser = membershipUser()

  const joinClubId = new URLSearchParams(location.search).get('club')
  const joinClubData = CLUBS[joinClubId]

  if (!joinClubData) {
    window.location.href = 'home.html'
  } else if (isMember(joinClubId)) {
    // member na, diretso sa club page
    window.location.href = 'club.html?club=' + encodeURIComponent(joinClubId)
  } else {
    document.title = 'Join ' + joinClubData.name
    document.documentElement.style.setProperty('--accent', joinClubData.color || '#38b6ff')

    const logo = document.getElementById('join-logo')
    logo.src = joinClubData.logo
    logo.onerror = () => logo.remove()
    document.getElementById('join-title').textContent = 'Join ' + joinClubData.name

    const form = document.getElementById('join-form')
    const status = document.getElementById('form-status')
    const extra = document.getElementById('extra-fields')

    // Prefill gamit ang account
    document.getElementById('f-email').value = joinUser.email || ''
    document.getElementById('f-fullname').value = joinUser.firstname || ''

    // Dagdag na field: Team (kung may teams ang club) at requirements ng club
    const addField = (id, label, type, options) => {
      const wrap = document.createElement('div')
      wrap.className = 'field'
      const lab = document.createElement('label')
      lab.htmlFor = id
      lab.textContent = label
      let input
      if (type === 'select') {
        input = document.createElement('select')
        const first = document.createElement('option')
        first.value = ''
        first.textContent = 'Select ' + label.toLowerCase()
        input.appendChild(first)
        options.forEach(o => {
          const opt = document.createElement('option')
          opt.textContent = o
          input.appendChild(opt)
        })
      } else {
        input = document.createElement('input')
        input.type = 'text'
      }
      input.id = id
      input.name = id
      const err = document.createElement('span')
      err.className = 'field-error'
      wrap.append(lab, input, err)
      extra.appendChild(wrap)
      return { id, label }
    }

    const extraFields = []
    if (joinClubData.teams && joinClubData.teams.length) {
      extraFields.push(addField('f-team', 'Team', 'select', joinClubData.teams.map(t => t.name)))
    }
    ;(joinClubData.requirements || []).forEach((label, i) => {
      extraFields.push(addField('f-req' + i, label, 'text'))
    })

    // ---------- Validation ----------
    const setError = (input, message) => {
      const field = input.closest('.field')
      field.classList.toggle('incorrect', !!message)
      const err = field.querySelector('.field-error')
      if (err) err.textContent = message || ''
    }

    const PH_MOBILE = /^(\+?63|0)9\d{9}$/
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const validate = () => {
      let ok = true
      const need = (id, message, test) => {
        const input = document.getElementById(id)
        const value = input.type === 'checkbox' ? input.checked : input.value.trim()
        const valid = test ? test(value) : !!value
        setError(input, valid ? '' : message)
        if (!valid) ok = false
      }

      need('f-fullname', 'Full name is required')
      need('f-studentId', 'Student ID number is required')
      need('f-email', 'Enter a valid email', v => EMAIL.test(v))
      need('f-contact', 'Enter a valid mobile number (e.g. 09123456789)', v => PH_MOBILE.test(v.replace(/[\s-]/g, '')))
      need('f-course', 'Course / program is required')
      need('f-year', 'Select your year level')
      need('f-section', 'Section is required')
      extraFields.forEach(f => need(f.id, f.label + ' is required'))
      need('f-agree', 'You need to agree before joining')

      return ok
    }

    // Alisin ang error kapag nag-type ulit
    form.addEventListener('input', (e) => setError(e.target, ''))
    form.addEventListener('change', (e) => setError(e.target, ''))

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      status.textContent = ''
      status.classList.remove('success')

      if (!validate()) {
        status.textContent = 'Please complete the highlighted requirements.'
        const first = form.querySelector('.field.incorrect')
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      const data = {
        fullname: document.getElementById('f-fullname').value.trim(),
        studentId: document.getElementById('f-studentId').value.trim(),
        email: document.getElementById('f-email').value.trim(),
        contact: document.getElementById('f-contact').value.trim(),
        course: document.getElementById('f-course').value.trim(),
        year: document.getElementById('f-year').value,
        section: document.getElementById('f-section').value.trim()
      }
      extraFields.forEach(f => {
        const value = document.getElementById(f.id).value.trim()
        if (f.id === 'f-team') {
          data.team = value
        } else {
          data.extra = data.extra || {}
          data.extra[f.label] = value
        }
      })

      // ipadala sa server (database)
      const submitBtn = form.querySelector('.submit-btn')
      submitBtn.disabled = true
      try {
        await joinClub(joinClubId, data)
      } catch (err) {
        submitBtn.disabled = false
        const idByField = {
          fullname: 'f-fullname', studentId: 'f-studentId', email: 'f-email', contact: 'f-contact',
          course: 'f-course', year: 'f-year', section: 'f-section'
        }
        Object.keys(err.fields || {}).forEach(key => {
          const input = idByField[key] && document.getElementById(idByField[key])
          if (input) setError(input, err.fields[key])
        })
        status.textContent = err.message
        return
      }

      status.classList.add('success')
      status.textContent = 'Welcome to ' + joinClubData.name + '! Opening the club page...'
      setTimeout(() => {
        window.location.href = 'club.html?club=' + encodeURIComponent(joinClubId)
      }, 1300)
    })
  }
}).catch(err => {
  if (err.message === 'not logged in') return
  console.error(err)
  const s = document.getElementById('form-status')
  if (s) s.textContent = 'Error: ' + err.message
})
