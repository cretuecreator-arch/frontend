const phoneInput = document.getElementById('phoneInput');
const sendBtn = document.getElementById('sendBtn');
const statusMsg = document.getElementById('statusMsg');

sendBtn.addEventListener('click', async () => {
  const number = phoneInput.value.trim();

  if (!number) {
    statusMsg.textContent = 'Please enter your phone number.';
    return;
  }

  const fullNumber = '+95' + number.replace(/\D/g, '');

  sendBtn.disabled = true;
  sendBtn.textContent = 'sending...';
  statusMsg.textContent = '';

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullNumber })
    });

    const data = await res.json();

    if (res.ok) {
      statusMsg.textContent = data.message || 'OTP sent successfully.';
    } else {
      statusMsg.textContent = data.error || 'Something went wrong. Please try again.';
    }
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server. Please try again later.';
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'send otp';
  }
});
