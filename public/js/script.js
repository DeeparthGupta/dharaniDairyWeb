document.getElementById('contact-form').addEventListener('submit', function (e) {
  e.preventDefault(); // Prevent page refresh

  // Get form data
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  // Send form data to the backend
  fetch('/submit-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, message })
  })
    .then(response => response.text())
    .then(data => {
      document.getElementById('form-response').textContent = data;
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('form-response').textContent = 'There was an error submitting the form.';
    });

  // Reset the form
  this.reset();
});
