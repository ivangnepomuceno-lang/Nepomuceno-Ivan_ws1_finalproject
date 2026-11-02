appReady.then(() => {
  if (!requireLogin()) return

  const grid = document.getElementById('club-grid')
  const search = document.getElementById('club-search')
  const filters = document.getElementById('filters')
  const noResult = document.getElementById('no-result')

  Object.entries(CLUBS).forEach(([id, club]) => {
    const card = document.createElement('div')
    card.className = 'club-card'
    card.dataset.search = (club.name + ' ' + club.short).toLowerCase()
    card.dataset.category = club.category || ''

    const img = document.createElement('img')
    img.loading = 'lazy'
    img.decoding = 'async'
    img.src = club.logo
    img.alt = club.name + ' logo'
    img.onerror = () => {
      const fb = document.createElement('div')
      fb.className = 'logo-fallback'
      fb.textContent = club.short
      img.replaceWith(fb)
    }

    const name = document.createElement('h3')
    name.className = 'club-name'
    name.textContent = club.name

    const short = document.createElement('span')
    short.className = 'club-short'
    short.textContent = club.short

    const link = document.createElement('a')
    link.className = 'visit'
    // not joined = "join" (fill up form), member = "visit"
    const member = isMember(id)
    if (member) {
      card.dataset.member = '1'
      link.href = 'club.html?club=' + encodeURIComponent(id)
      link.textContent = 'visit'
      const badge = document.createElement('span')
      badge.className = 'joined-badge'
      badge.textContent = 'Joined'
      card.appendChild(badge)
    } else {
      link.classList.add('join')
      link.href = 'join.html?club=' + encodeURIComponent(id)
      link.textContent = 'join'
    }

    card.append(img, name, short, link)
    grid.appendChild(card)
  })

  // ---------- Search + category filter ----------
  let activeCategory = 'All'

  const categories = ['All']
  if (Object.keys(getMyClubs()).length > 0) categories.push('My clubs')
  Object.values(CLUBS).forEach(c => {
    if (c.category && !categories.includes(c.category)) categories.push(c.category)
  })

  function applyFilter() {
    const q = search.value.trim().toLowerCase()
    let shown = 0
    grid.querySelectorAll('.club-card').forEach(card => {
      const matchText = card.dataset.search.includes(q)
      const matchCat =
        activeCategory === 'All' ||
        (activeCategory === 'My clubs' ? card.dataset.member === '1' : card.dataset.category === activeCategory)
      card.hidden = !(matchText && matchCat)
      if (!card.hidden) shown++
    })
    noResult.hidden = shown !== 0
  }

  categories.forEach(cat => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'chip' + (cat === 'All' ? ' active' : '')
    btn.textContent = cat
    btn.addEventListener('click', () => {
      activeCategory = cat
      filters.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b === btn))
      applyFilter()
    })
    filters.appendChild(btn)
  })

  search.addEventListener('input', applyFilter)

  // for admin / officers
  if (typeof manageableClubs === 'function' && manageableClubs().length > 0) {
    const manage = document.createElement('a')
    manage.className = 'admin-link'
    manage.href = 'admin.html'
    manage.textContent = 'Admin panel'
    const topbar = document.querySelector('.topbar')
    topbar.insertBefore(manage, document.getElementById('logout-form'))
  }
})
