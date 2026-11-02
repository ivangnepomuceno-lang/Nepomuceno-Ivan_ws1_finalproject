


const form = document.getElementById('form')
const firstname_input = document.getElementById('firstname_input')
const email_input = document.getElementById('email_input')
const password_input = document.getElementById('password_input')
const confirm_password_input = document.getElementById('confirm_password_input')
const error_message = document.getElementById('error-message')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function showMessage(text, isSuccess = false) {
  if (!error_message) return
  error_message.textContent = text
  error_message.classList.toggle('success', isSuccess)
}

function markIncorrect(input) {
  if (input) input.parentElement.classList.add('incorrect')
}

function clearErrors() {
  document.querySelectorAll('.incorrect').forEach(el => el.classList.remove('incorrect'))
  showMessage('')
}


function getSignupFormErrors(firstname, email, password, confirmPassword) {
  const errors = []

  if (firstname.trim() === '') {
    errors.push('Firstname is required')
    markIncorrect(firstname_input)
  }
  if (email.trim() === '') {
    errors.push('Email is required')
    markIncorrect(email_input)
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.push('Enter a valid email')
    markIncorrect(email_input)
  }
  if (password === '') {
    errors.push('Password is required')
    markIncorrect(password_input)
  } else if (password.length < 8) {
    errors.push('Password must have at least 8 characters')
    markIncorrect(password_input)
  }
  if (confirmPassword === '') {
    errors.push('Confirm your password')
    markIncorrect(confirm_password_input)
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match')
    markIncorrect(password_input)
    markIncorrect(confirm_password_input)
  }

  return errors
}

function getLoginFormErrors(email, password) {
  const errors = []

  if (email.trim() === '') {
    errors.push('Email is required')
    markIncorrect(email_input)
  }
  if (password === '') {
    errors.push('Password is required')
    markIncorrect(password_input)
  }

  return errors
}

// ---------- Signup / Login ----------
if (form && form.id === 'form') {
  const submitButton = form.querySelector('button[type="submit"]')
  const setBusy = (busy) => { if (submitButton) submitButton.disabled = busy }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    clearErrors()

    if (firstname_input) {
      // ===== SIGNUP =====
      const errors = getSignupFormErrors(
        firstname_input.value,
        email_input.value,
        password_input.value,
        confirm_password_input.value
      )
      if (errors.length > 0) {
        showMessage(errors.join('. '))
        return
      }

      setBusy(true)
      try {
        await apiRequest('signup.php', {
          method: 'POST',
          data: {
            firstname: firstname_input.value.trim(),
            email: email_input.value.trim(),
            password: password_input.value
          }
        })
        showMessage('Account created! Redirecting to login...', true)
        setTimeout(() => { window.location.href = 'login.html' }, 1200)
      } catch (err) {
        if (err.fields && err.fields.email) markIncorrect(email_input)
        if (err.fields && err.fields.firstname) markIncorrect(firstname_input)
        if (err.fields && err.fields.password) markIncorrect(password_input)
        showMessage(err.message)
        setBusy(false)
      }
    } else {
      // ===== LOGIN =====
      const errors = getLoginFormErrors(email_input.value, password_input.value)
      if (errors.length > 0) {
        showMessage(errors.join('. '))
        return
      }

      setBusy(true)
      try {
        await apiRequest('login.php', {
          method: 'POST',
          data: { email: email_input.value.trim(), password: password_input.value }
        })
        window.location.href = 'home.html'
      } catch (err) {
        if (err.status === 401) {
          markIncorrect(email_input)
          markIncorrect(password_input)
        }
        showMessage(err.message)
        setBusy(false)
      }
    }
  })

  // Alisin ang pula kapag nag-type ulit ang user
  const allInputs = [firstname_input, email_input, password_input, confirm_password_input]
    .filter(input => input != null)

  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.parentElement.classList.remove('incorrect')
      showMessage('')
    })
  })

  // Kung naka-login na, diretso sa home. Kung hindi maabot ang server, ipakita ang dahilan.
  appReady.then(() => {
    if (APP_USER) {
      window.location.href = 'home.html'
    } else if (APP_ERROR) {
      showMessage(APP_ERROR)
    }
  })
}

// ---------- Home page (protected) ----------
const welcome_name = document.getElementById('welcome-name')
const logout_form = document.getElementById('logout-form')

if (welcome_name) {
  appReady.then(() => {
    if (!APP_USER) {
      window.location.href = 'login.html'
    } else {
      welcome_name.textContent = APP_USER.firstname
    }
  })
}

if (logout_form) {
  logout_form.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      await apiRequest('logout.php', { method: 'POST' })
    } catch {}
    window.location.href = 'login.html'
  })
}
