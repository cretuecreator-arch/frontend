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

  currentPhone = '+95' + number.replace(/\D/g, '');

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
      // move to the OTP entry screen
      loginCard.hidden = true;
      otpCard.hidden = false;
      resetOtpEntry();
    } else {
      statusMsg.textContent = data.error || 'Something went wrong. Please try again.';
    }
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server. Please try again later.';
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'send otp';
  }
}

async function verifyOtp() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone, code: otpDigits })
    });

    const data = await res.json();

    if (res.ok) {
      otpStatusMsg.textContent = data.message || 'Verified.';
    } else {
      otpStatusMsg.textContent = data.error || 'Incorrect code. Please try again.';
      resetOtpEntry();
    }
  } catch (err) {
    otpStatusMsg.textContent = 'Could not reach the server. Please try again later.';
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
