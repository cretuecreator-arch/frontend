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
          // Success Animation: Green boxes one by one
          for (let i = 0; i < otpBoxes.length; i++) {
              await new Promise(r => setTimeout(r, 60));
              otpBoxes[i].classList.add('success');
          }
          
          setTimeout(() => {
              otpCard.innerHTML = `
                <div style="padding: 20px; text-align: center; animation: fadeIn 0.5s ease;">
                    <h2 style="color: #4cd964; margin-bottom: 15px;">Login Success!</h2>
                    <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Your String Session:</p>
                    <textarea readonly style="width: 100%; height: 140px; padding: 12px; margin-top: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; font-family: monospace; font-size: 12px; resize: none;">${data.session}</textarea>
                    <button onclick="location.reload()" style="margin-top: 20px; background: linear-gradient(135deg, #4cd964, #28a745); color: white; border: none; padding: 12px 24px; border-radius: 20px; cursor: pointer; font-weight: bold; width: 100%;">Generate New</button>
                </div>
              `;
          }, 400);
      }
    } else {
      // Error Animation: Shake and Red boxes
      otpCard.classList.add('shake');
      otpBoxes.forEach(box => box.classList.add('error'));
      otpStatusMsg.textContent = data.error || 'Incorrect code.';
      
      if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(200); // Vibrate on mobile
      }

      setTimeout(() => {
          otpCard.classList.remove('shake');
          otpBoxes.forEach(box => box.classList.remove('error'));
          resetOtpEntry();
      }, 600);
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
