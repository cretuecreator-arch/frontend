const phoneInput = document.getElementById('phoneInput');
const sendBtn = document.getElementById('sendBtn');
const statusMsg = document.getElementById('statusMsg');

const loginCard = document.querySelector('.card:not(.otp-card)');
const otpCard = document.getElementById('otpCard');
const otpBoxes = Array.from(document.querySelectorAll('.otp-box'));
const otpStatusMsg = document.getElementById('otpStatusMsg');
const sendAgainBtn = document.getElementById('sendAgainBtn');
const deleteKey = document.getElementById('deleteKey');
const keys = document.querySelectorAll('.key[data-key]');

const OTP_LENGTH = 5;
let otpDigits = '';
let currentPhone = '';

function renderOtpBoxes() {
  otpBoxes.forEach((box, i) => {
    box.textContent = otpDigits[i] || '';
    box.classList.toggle('filled', Boolean(otpDigits[i]));
  });
}

function resetOtpEntry() {
  otpDigits = '';
  renderOtpBoxes();
  otpStatusMsg.textContent = '';
}

async function requestOtp() {
  const number = phoneInput.value.trim();
  if (!number) {
    statusMsg.textContent = 'Please enter your phone number.';
    return;
  }

  // Ensure phone starts with +
  currentPhone = number.startsWith('+') ? number : '+95' + number.replace(/\D/g, '');

  sendBtn.disabled = true;
  sendBtn.textContent = 'sending...';
  statusMsg.textContent = '';

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone })
    });

    const data = await res.json();

    if (res.ok) {
      loginCard.hidden = true;
      otpCard.hidden = false;
      resetOtpEntry();
    } else {
      statusMsg.textContent = data.error || 'Something went wrong.';
    }
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'send otp';
  }
}

async function verifyOtp(password = null) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          phone: currentPhone, 
          code: otpDigits,
          password: password
      })
    });

    const data = await res.json();

    if (res.ok) {
      if (data.status === 'password_required') {
          const pass = prompt('Enter your Two-Step Verification Password:');
          if (pass) verifyOtp(pass);
      } else {
          // Display the result
          otpCard.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2 style="color: #0088cc;">Login Success!</h2>
                <p>Your String Session:</p>
                <textarea readonly style="width: 100%; height: 150px; padding: 10px; margin-top: 10px; border-radius: 8px; border: 1px solid #ccc; font-family: monospace;">${data.session}</textarea>
                <button onclick="location.reload()" style="margin-top: 20px; background: #0088cc; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Generate New</button>
            </div>
          `;
      }
    } else {
      otpStatusMsg.textContent = data.error || 'Incorrect code.';
      resetOtpEntry();
    }
  } catch (err) {
    otpStatusMsg.textContent = 'Server error.';
    resetOtpEntry();
  }
}

sendBtn.addEventListener('click', requestOtp);

sendAgainBtn.addEventListener('click', async () => {
  sendAgainBtn.disabled = true;
  await requestOtp();
  loginCard.hidden = true;
  otpCard.hidden = false;
  sendAgainBtn.disabled = false;
});

keys.forEach((key) => {
  key.addEventListener('click', () => {
    if (otpDigits.length >= OTP_LENGTH) return;
    otpDigits += key.dataset.key;
    renderOtpBoxes();
    if (otpDigits.length === OTP_LENGTH) {
      verifyOtp();
    }
  });
});

deleteKey.addEventListener('click', () => {
  otpDigits = otpDigits.slice(0, -1);
  renderOtpBoxes();
  otpStatusMsg.textContent = '';
});
