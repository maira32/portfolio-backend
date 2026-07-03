const { Resend } = require('resend');

const sendContactEmail = async (req, res) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, message } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to: 'mairatahir3@gmail.com', 
      subject: `New Portfolio Message from ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #f97316;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <br/>
            <p><strong>Message:</strong></p>
            <p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ message: 'Failed to send email.' });
    }

    console.log(`Email successfully sent to you from ${name}!`);
    res.status(200).json({ message: 'Message received successfully!' });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { sendContactEmail };