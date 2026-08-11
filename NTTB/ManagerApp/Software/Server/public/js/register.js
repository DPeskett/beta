// public/js/register.js
// Handle Client-side registration form: validation, request, and UI feedback.

// Selectors
const registerForm = document.getElementById('registerForm');
const registerButton = document.getElementById('registerButton');
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
function validateInputs(user_name, email, password) {
  if (!user_name) return 'Please enter your full name.';
  if (!email || !email.includes('@')) return 'Please enter a valid email.';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// Submit handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const user_name = document.getElementById('user_name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();

  // Client-side validation
  const validationError = validateInputs(user_name, email, password);
  if (validationError) {
    showMessage(validationError, true);
    return;
  }

  // UI: loading state
  registerButton.disabled = true;
  const originalText = registerButton.textContent;
  registerButton.textContent = 'Creating account...';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name, email, password, phone })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('Registration successful. Redirecting...');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    } else {
      showMessage(data.error || 'Registration failed. Please try again.', true);
    }
  } catch (err) {
    console.error('Network error during registration:', err);
    showMessage('Network error. Please try again later.', true);
  } finally {
    // Restore button state
    registerButton.disabled = false;
    registerButton.textContent = originalText;
  }
});