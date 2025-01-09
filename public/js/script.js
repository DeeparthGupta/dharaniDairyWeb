const { contentType } = require("express/lib/response");

$(document).ready(function(){
  $('contact-form').on('submit',function(e){
    e.preventDefault(); //prevents page refresh

    //Get the values from the contact form
    const name = $('name').val();
    const email = $('email').val();
    const phone = $('phone').val();
    const message = $('message').val();

    //Send data to the backend
    $.ajax({
      url: "/submit-form",
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({name, email, phone, message}),
      success: function(data){
        $('#form-response ').text(data);
      },
      error: function(error){
        console.error('Error:', error);
        $('#form-response').text('An error has occured.')
      }
    });
    //Reset the form
    this.reset();
  });
});