
(function () {
  const wall = document.getElementById('logo-wall')
  if (!wall || typeof CLUBS === 'undefined') return

  Object.values(CLUBS).forEach((club, i) => {
    const img = document.createElement('img')
    img.src = club.logo
    img.alt = ''
    img.title = club.name
    img.style.setProperty('--i', i)
    img.onerror = () => img.remove()
    wall.appendChild(img)
  })
})()
