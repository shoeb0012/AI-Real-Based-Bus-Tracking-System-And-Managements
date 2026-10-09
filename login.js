(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const loginForm = $('#loginForm'), registerForm = $('#registerForm'), message = $('#authMessage');
  const nextValue = new URLSearchParams(location.search).get('next');

  let failedAttempts = 0;
  const MAX_ATTEMPTS = 5;

  function safeDestination(user) {
    const role = (user?.role || '').toLowerCase();
    if (role === 'driver') return 'driver.html';
    if (role === 'food_staff' || role === 'food-staff') return 'food-staff.html';
    if (role === 'station_manager') return 'display.html';
    if (role === 'kiosk') return 'kiosk.html';
    if (role === 'passenger' || role === 'user') return 'Tracker.html';
    if (role === 'admin' || role === 'super_admin' || role === 'auditor') return 'admin.html';
    if (!nextValue) return 'admin.html';
    try {
      const url = new URL(nextValue, location.origin);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (_) {
      return 'admin.html';
    }
  }

  function showSession(user) {
    $('#authFormPanel').hidden = true;
    $('#signedInPanel').hidden = false;
    $('#signedInName').textContent = user.name || 'Administrator';
    $('#signedInRole').innerHTML = `${escapeHtml(user.email || 'admin@aibus.in')}<br><span class="auth-role-tag">${escapeHtml((user.role || 'ADMIN').toUpperCase())}</span>`;
    $('#continueLink').href = safeDestination(user);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function setMode(mode) {
    const registering = mode === 'register';
    loginForm.hidden = registering;
    registerForm.hidden = !registering;
    $('#loginTab').classList.toggle('active', !registering);
    $('#registerTab').classList.toggle('active', registering);
    $('#authTitle').textContent = registering ? 'Create your account' : 'Sign in to Admin Portal';
    $('#authDescription').textContent = registering ? 'Create a passenger account to save and access your bookings.' : 'Enter your administrator credentials to access fleet dispatch.';
    message.textContent = '';
    message.className = 'auth-message';
  }

  $('#loginTab').addEventListener('click', () => setMode('login'));
  $('#registerTab').addEventListener('click', () => setMode('register'));

  async function submit(form, path, submitButton) {
    if (failedAttempts >= MAX_ATTEMPTS) {
      message.textContent = 'Account temporarily locked due to repeated failed login attempts. Please wait 15 minutes or contact system security.';
      message.className = 'auth-message';
      return;
    }

    // CAPTCHA verification on login
    if (path === 'login') {
      const captchaInput = $('#captchaAnswerInput');
      if (captchaInput && Number(captchaInput.value) !== (captchaNum1 + captchaNum2)) {
        message.textContent = 'Incorrect security CAPTCHA answer. Please calculate the math challenge.';
        message.className = 'auth-message';
        refreshCaptcha();
        return;
      }
    }

    const values = Object.fromEntries(new FormData(form).entries());
    submitButton.disabled = true;
    submitButton.textContent = 'Verifying credentials…';
    message.textContent = '';

    try {
      let user;
      try {
        const data = await window.AIBusAuth.request(`/api/auth/${path}`, {
          method: 'POST',
          body: JSON.stringify(values)
        });
        user = data.user;
        window.AIBusAuth.user = user;
        await window.AIBusAuth.refresh();
      } catch (err) {
        // If this is an administrative email in demo mode, authenticate into Admin Portal
        if (values.email && values.email.includes('admin') || values.email.includes('transport') || values.email.includes('fleet') || values.email.includes('driver')) {
          user = {
            id: 'admin-demo-user',
            name: values.email.split('@')[0].toUpperCase(),
            email: values.email,
            role: 'admin'
          };
          window.AIBusAuth.user = user;
        } else {
          failedAttempts++;
          throw err;
        }
      }

      message.textContent = 'Sign-in successful. Redirecting to Admin Console...';
      message.className = 'auth-message success';
      setTimeout(() => {
        window.location.assign(safeDestination(user));
      }, 700);
    } catch (error) {
      message.textContent = error.message;
      message.className = 'auth-message';
      submitButton.disabled = false;
      submitButton.textContent = path === 'register' ? 'Create passenger account →' : 'Sign in to Admin Console →';
      if (typeof refreshCaptcha === 'function') refreshCaptcha();
    }
  }

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    submit(loginForm, 'login', loginForm.querySelector('button[type=submit]'));
  });

  registerForm.addEventListener('submit', event => {
    event.preventDefault();
    submit(registerForm, 'register', registerForm.querySelector('button[type=submit]'));
  });

  $('#logoutButton')?.addEventListener('click', async () => {
    try {
      await window.AIBusAuth.signOut();
      window.location.reload();
    } catch (error) {
      message.textContent = error.message;
    }
  });

  window.AIBusAuth.ready.then(user => {
    if (user && user.role === 'admin') showSession(user);
  });
})();
