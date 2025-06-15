document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form form');
  const phoneInput = form.phone;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // reset any previous custom validity on phone
    phoneInput.setCustomValidity('');

    // 1) HTML5 native validation (required fields, email format)
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // 2) Custom phone validation: exactly 10 digits, no letters or symbols
    const raw = phoneInput.value.trim();
    if (raw && !/^[0-9]{10}$/.test(raw)) {
      phoneInput.setCustomValidity(
        'Please enter exactly 10 digits (no letters or symbols).'
      );
      phoneInput.reportValidity();
      return;
    }

    // 3) All validation passed → gather data
    const data = {
      firstName: form.firstName.value.trim(),
      lastName:  form.lastName.value.trim(),
      email:     form.email.value.trim(),
      phone:     raw,
      message:   form.message.value.trim(),
    };

    // 4) Send to server
    try {
      const res = await fetch(form.action, {
        method:  form.method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        alert('Your message was sent successfully!');
        form.reset();
      } else {
        const { error } = await res.json();
        alert(error || 'Server error. Please try again.');
      }
    } catch {
      alert('Network error. Please try later.');
    }
  });
});
