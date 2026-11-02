appReady.then(async () => {
  if (!requireLogin()) return

  const id = new URLSearchParams(location.search).get('club')
  const club = CLUBS[id]

  // Para sa members lang: kapag hindi pa sumali, ipapadala sa join form
  const allowed = !!club && isMember(id)

  if (!club) {
    window.location.href = 'home.html'
  } else if (!allowed) {
    window.location.href = 'join.html?club=' + encodeURIComponent(id)
  } else {
    document.title = club.name

    // Kulay at hero logo muna, para hindi mawala kahit may error sa ibang bahagi
    document.documentElement.style.setProperty('--accent', club.color || '#38b6ff')
    const heroLogo = document.getElementById('hero-logo')
    if (heroLogo) {
      heroLogo.src = club.logo
      heroLogo.alt = club.name + ' logo'
      heroLogo.onerror = () => heroLogo.remove()
    }
    document.getElementById('nav-logo').src = club.logo
    document.getElementById('nav-logo').onerror = function () { this.style.display = 'none' }
    document.getElementById('nav-name').textContent = club.short
    document.getElementById('club-title').textContent = club.name
    document.getElementById('club-tagline').textContent = club.tagline
    document.getElementById('members-title').textContent = club.short + ' Members'
    const msg = document.getElementById('members-msg')
    if (club.membersMessage) msg.textContent = club.membersMessage
    else msg.remove()

    const actMsg = document.getElementById('activities-msg')
    if (club.activitiesMessage) actMsg.textContent = club.activitiesMessage
    else actMsg.remove()

    const annMsg = document.getElementById('announcement-msg')
    if (club.announcementsMessage) annMsg.textContent = club.announcementsMessage
    else annMsg.remove()

    try {
      // About
      const aboutBox = document.getElementById('about-text')
      document.getElementById('about-title').textContent = 'About ' + club.short
      if (club.about) {
        aboutBox.textContent = club.about
      } else {
        document.getElementById('about').remove()
        document.getElementById('nav-about').remove()
      }

      // Footer
      document.getElementById('foot-club').textContent = club.name

      // Member badge 
      const myInfo = getMyClubs()[id]
      const badge = document.getElementById('member-badge')
      if (myInfo && myInfo.joinedAt) {
        const when = new Date(myInfo.joinedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
        badge.textContent = 'Member since ' + when
      } else {
        badge.remove()
      }

      // Facebook link (kung nilagay sa clubs.js)
      const links = document.getElementById('foot-links')
      if (club.facebook) {
        const fb = document.createElement('a')
        fb.href = club.facebook
        fb.target = '_blank'
        fb.rel = 'noopener noreferrer'
        fb.textContent = 'Visit our Facebook page'
        links.appendChild(fb)
      } else {
        links.remove()
      }

      // Leave club
      document.getElementById('leave-btn').addEventListener('click', async () => {
        if (confirm('Leave ' + club.name + '? You will need to fill out the form again to rejoin.')) {
          try {
            await leaveClub(id)
            window.location.href = 'home.html'
          } catch (err) {
            alert(err.message)
          }
        }
      })
      document.getElementById('foot-year').textContent = new Date().getFullYear()
    } catch (err) {
      console.error('About/footer error:', err)
    }

    const empty = (text) => {
      const p = document.createElement('p')
      p.className = 'empty'
      p.textContent = text
      return p
    }
    const makeImg = (src, alt) => {
      const img = document.createElement('img')
      img.loading = 'lazy'
      img.decoding = 'async'
      img.addEventListener('load', () => img.classList.add('loaded'))
      img.src = src
      img.alt = alt
      img.onerror = () => img.remove()
      return img
    }

    // Members
    const members = document.getElementById('members-list')
    if (club.teams && club.teams.length) {
      // maraming team: may sariling pangalan at picture ang bawat isa
      members.classList.add('has-teams')
      club.teams.forEach(team => {
        const box = document.createElement('div')
        box.className = 'team'

        const title = document.createElement('h3')
        title.className = 'team-name'
        title.textContent = team.name

        const imgs = document.createElement('div')
        imgs.className = 'team-images'
        if (team.members.length === 0) imgs.appendChild(empty('Wala pang members na nakalagay.'))
        team.members.forEach(src => imgs.appendChild(makeImg(src, team.name + ' members')))

        if (team.message) {
          const note = document.createElement('p')
          note.className = 'team-msg'
          note.textContent = team.message
          box.append(title, note, imgs)
        } else {
          box.append(title, imgs)
        }
        members.appendChild(box)
      })
    } else {
      if (club.members.length === 0) members.appendChild(empty('Wala pang members na nakalagay.'))
      club.members.forEach(src => members.appendChild(makeImg(src, 'Members')))
    }

    // Activities carousel
    const track = document.getElementById('activity-track')
    if (club.activities.length === 0) track.appendChild(empty('Wala pang activities.'))
    club.activities.forEach(src => track.appendChild(makeImg(src, 'Activity')))
    document.getElementById('prev').onclick = () => track.scrollBy({ left: -500, behavior: 'smooth' })
    document.getElementById('next').onclick = () => track.scrollBy({ left: 500, behavior: 'smooth' })

    try {
      // Announcements: galing sa admin page + galing sa clubs.js
      const list = document.getElementById('announce-list')
      let posted = []
      try {
        posted = await getStoredAnnouncements(id)
      } catch (err) {
        console.error('Could not load announcements:', err)
      }
      const allAnnouncements = posted.concat(club.announcements)
      if (allAnnouncements.length === 0) list.appendChild(empty('Wala pang announcement.'))
      allAnnouncements.forEach(a => {
        const item = document.createElement('div')
        item.className = 'announce'
        if (a.image) item.appendChild(makeImg(a.image, 'Announcement'))
        else item.classList.add('text-only')
        if (a.title) {
          const t = document.createElement('h4')
          t.className = 'announce-title'
          t.textContent = a.title
          item.appendChild(t)
        }
        if (a.date && typeof formatAnnouncementDate === 'function') {
          const d = document.createElement('span')
          d.className = 'announce-date'
          d.textContent = formatAnnouncementDate(a.date)
          item.appendChild(d)
        }
        if (a.text) {
          const p = document.createElement('p')
          p.textContent = a.text
          item.appendChild(p)
        }
        list.appendChild(item)
      })

      // Link para sa admin / officers
      if (typeof isAdminFor === 'function' && isAdminFor(id)) {
        const manage = document.createElement('a')
        manage.className = 'admin-link'
        manage.href = 'admin.html?club=' + encodeURIComponent(id)
        manage.textContent = 'Manage announcements'
        document.querySelector('#announcement .members-head').appendChild(manage)
      }
    } catch (err) {
      console.error('Announcements error:', err)
    }
  }


  // ============================================================
  //  KULAY NG CLUB + HERO LOGO + CLICK PARA PALAKIHIN
  // ============================================================
  if (allowed) {
    // Lightbox
    const lb = document.getElementById('lightbox')
    const lbImg = document.getElementById('lb-img')
    const lbCount = document.getElementById('lb-count')
    let group = []
    let current = 0

    const show = () => {
      lbImg.src = group[current].src
      lbCount.textContent = group.length > 1 ? (current + 1) + ' / ' + group.length : ''
      document.getElementById('lb-prev').hidden = group.length < 2
      document.getElementById('lb-next').hidden = group.length < 2
    }
    const open = (imgs, index) => {
      group = imgs
      current = index
      show()
      lb.hidden = false
      document.body.style.overflow = 'hidden'
    }
    const close = () => {
      lb.hidden = true
      document.body.style.overflow = ''
    }
    const step = (n) => {
      current = (current + n + group.length) % group.length
      show()
    }

    // bawat section ay may sariling grupo ng picture
    ;['.team-images', '#members-list:not(.has-teams)', '#activity-track', '#announce-list'].forEach(sel => {
      document.querySelectorAll(sel).forEach(box => {
        const imgs = Array.from(box.querySelectorAll('img'))
        imgs.forEach((img, i) => {
          img.classList.add('zoomable')
          img.addEventListener('click', () => open(imgs, i))
        })
      })
    })

    document.getElementById('lb-close').onclick = close
    document.getElementById('lb-prev').onclick = (e) => { e.stopPropagation(); step(-1) }
    document.getElementById('lb-next').onclick = (e) => { e.stopPropagation(); step(1) }
    lb.addEventListener('click', (e) => { if (e.target === lb) close() })
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' && group.length > 1) step(-1)
      if (e.key === 'ArrowRight' && group.length > 1) step(1)
    })
  }

  // ============================================================
  //  EFFECTS (para sa club pages lang)
  // ============================================================
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (allowed && !reduceMotion) {
    document.documentElement.classList.add('js')

    // 1) Scroll reveal: lalabas isa-isa pag nakita sa screen
    const targets = document.querySelectorAll(
      '.block h2, .eyebrow, .members-msg, .about-text, .join-step, .join-btn, .team-msg, .team-name, .members-wrap img, .track img, .announce, .empty'
    )
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })

    targets.forEach((el) => {
      el.classList.add('reveal')
      const index = Array.prototype.indexOf.call(el.parentElement.children, el)
      el.style.setProperty('--d', Math.min(index, 6) * 0.12 + 's') // stagger
      io.observe(el)
    })

    // 2) Navbar lumiliit pag nag-scroll + 3) Parallax sa hero at background
    const navbar = document.querySelector('.navbar')
    const hero = document.querySelector('.hero')
    let ticking = false

    const onScroll = () => {
      const y = window.scrollY
      navbar.classList.toggle('scrolled', y > 40)
      if (y < window.innerHeight) {
        hero.style.transform = 'translateY(' + y * 0.35 + 'px)'
        hero.style.opacity = Math.max(0, 1 - y / 520)
      }
      document.body.style.backgroundPosition = 'center ' + (y * -0.08) + 'px'
      ticking = false
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScroll)
        ticking = true
      }
    }, { passive: true })
    onScroll()
  }
})
