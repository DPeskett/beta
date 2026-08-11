// public/js/script.js
// Handles the login form: validation, request, token storage, and UI feedback.

// Selectors
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const formMessage = document.getElementById('formMessage');

// Utility: show status messages (success or error)
function showMessage(text, isError = false) {
  formMessage.textContent = text;
  formMessage.style.color = isError ? '#b00020' : '#0b6623';
}

// Reset form message
function clearMessage() {
  formMessage.textContent = '';
}

// Basic client-side validation
function validateInputs(email, password) {
  if (!email || !email.includes('@')) return 'Please enter a valid email.';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// Submit handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Client-side validation
  const validationError = validateInputs(email, password);
  if (validationError) {
    showMessage(validationError, true);
    return;
  }

  // UI: loading state
  loginButton.disabled = true;
  const originalText = loginButton.textContent;
  loginButton.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      // Persist token for authenticated requests; use sessionStorage if you prefer shorter-lived session
      localStorage.setItem('token', data.token);

      showMessage('Login successful. Redirecting...');
      // small delay so user sees success message before redirect
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 600);
    } else {
      // Show server-provided message or a generic fallback
      showMessage(data.error || 'Login failed. Check your credentials.', true);
      // focus first input for quick retry
      document.getElementById('email').focus();
    }
  } catch (err) {
    // Network or unexpected error
    console.error('Network error during login:', err);
    showMessage('Network error. Please try again later.', true);
  } finally {
    // Restore button state
    loginButton.disabled = false;
    loginButton.textContent = originalText;
  }
});