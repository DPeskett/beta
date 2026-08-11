// public/js/script.js
// Client-side logic for login.html (index.html)
// - validates inputs
// - shows inline field errors and a status message
// - toggles password visibility (if togglePassword button exists)
// - posts to /api/login and stores token + user on success

// Selectors
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const formMessage = document.getElementById('formMessage');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const togglePasswordBtn = document.getElementById('togglePassword');

// Small helpers
function setFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = msg ? '#b00020' : '';
}
function showMessage(msg, isError = false) {
  if (!formMessage) return;
  formMessage.textContent = msg || '';
  formMessage.style.color = isError ? '#b00020' : '#0b6623';
}
function clearAllMessages() {
  setFieldError(emailError, '');
  setFieldError(passwordError, '');
  showMessage('');
}

// Basic validation (keeps behavior minimal and consistent with server)
function validateInputs(email, password) {
  clearAllMessages();
  if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
    setFieldError(emailError, 'Please enter a valid email.');
    return false;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    setFieldError(passwordError, 'Password must be at least 6 characters.');
    return false;
  }
  return true;
}

// Password toggle (safe no-op if element absent)
if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPwd = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPwd ? 'text' : 'password');
    togglePasswordBtn.textContent = isPwd ? 'Hide' : 'Show';
    togglePasswordBtn.setAttribute('aria-label', isPwd ? 'Hide password' : 'Show password');
  });
}

// Focus handlers to clear inline errors when user edits fields
if (emailInput) {
  emailInput.addEventListener('input', () => setFieldError(emailError, ''));
}
if (passwordInput) {
  passwordInput.addEventListener('input', () => setFieldError(passwordError, ''));
}

// Submit handler
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllMessages();

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    // Client-side validation
    if (!validateInputs(email, password)) {
      // focus the first invalid field
      if (emailError && emailError.textContent) emailInput.focus();
      else if (passwordError && passwordError.textContent) passwordInput.focus();
      showMessage('Please fix the errors above and try again.', true);
      return;
    }

    // UI: loading state
    const originalBtnText = loginButton ? loginButton.textContent : null;
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = 'Logging in...';
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Persist token and user object for authenticated requests
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('Login successful. Redirecting...');
        // short delay so the user sees the message
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 600);
      } else {
        // Map likely server errors to inline messages where appropriate
        const errMsg = (data && data.error) ? String(data.error) : 'Login failed. Check your credentials.';
        // If server indicates invalid credentials, show general form error only
        if (/invalid/i.test(errMsg) || /credentials/i.test(errMsg)) {
          showMessage(errMsg, true);
          if (emailInput) emailInput.focus();
        } else if (/email/i.test(errMsg) && /exist|registered|duplicate/i.test(errMsg)) {
          setFieldError(emailError, errMsg);
          emailInput && emailInput.focus();
        } else {
          showMessage(errMsg, true);
        }
      }
    } catch (err) {
      console.error('Network error during login:', err);
      showMessage('Network error. Please try again later.', true);
    } finally {
      if (loginButton) {
        loginButton.disabled = false;
        if (originalBtnText) loginButton.textContent = originalBtnText;
      }
    }
  });
}