// public/js/register.js
// Handles client-side registration form: validation, request, and UI feedback

// Selectors
const registerForm = document.getElementById('registerForm');
const registerButton = document.getElementById('registerButton');
const formMessage = document.getElementById('formMessage');

const userNameInput = document.getElementById('user_name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const phoneInput = document.getElementById('phone');

const userNameError = document.getElementById('userNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const phoneError = document.getElementById('phoneError');

// Helpers
function setFieldError(el, msg) {
  if (el) el.textContent = msg || '';
}
function showMessage(msg, isError = false) {
  if (formMessage) {
    formMessage.textContent = msg || '';
    formMessage.style.color = isError ? '#b00020' : '#0b6623';
  }
}
function clearAllMessages() {
  setFieldError(userNameError, '');
  setFieldError(emailError, '');
  setFieldError(passwordError, '');
  setFieldError(phoneError, '');
  showMessage('');
}

// Validation
function validateInputs(user_name, email, password, phone) {
  clearAllMessages();
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let valid = true;

  if (!user_name || user_name.length < 3 || user_name.length > 50) {
    setFieldError(userNameError, 'Full name must be between 3 and 50 characters.');
    valid = false;
  }

  if (!email || !email_regex.test(email)) {         // !email.includes('@') || !email.includes('.') || ) {
    setFieldError(emailError, 'Please enter a valid email.');
    valid = false;
  }

  if (!password || password.length < 6) {
    setFieldError(passwordError, 'Password must be at least 6 characters.');
    valid = false;
  }
  if (phone) {  // phone =  null is acceptable
    phone = phone.replace(/\D/g, '');
    if (phone.length !== 10) {                 //  !phone || !/^(\d{3}-\d{3}-\d{4}|\d{10})$/.test(phone)) {
      setFieldError(phoneError, 'Phone must be 10 digits.');
      valid = false;
    }
  }
  return valid;
}

// Submit handler
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllMessages();

    const user_name = userNameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    const phone = phoneInput?.value.trim();

    if (!validateInputs(user_name, email, password, phone)) {
      showMessage('Please fix the errors above and try again.', true);
      return;
    }

    // UI: loading state
    const originalText = registerButton?.textContent;
    if (registerButton) {
      registerButton.disabled = true;
      registerButton.textContent = 'Creating account...';
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name, email, password, phone })
      });

      const data = await res.json();

      if (res.status === 201) {
        showMessage('Registration successful. Redirecting...');
        registerForm.reset();
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
      if (registerButton) {
        registerButton.disabled = false;
        if (originalText) registerButton.textContent = originalText;
      }
    }
  });
}
