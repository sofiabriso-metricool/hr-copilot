require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('Testing with User:', process.env.EMAIL_USER);
    console.log('Pass length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'undefined');

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'Nodemailer Test',
        text: 'If you see this, email is working!'
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.response);
    } catch (err) {
        console.error('❌ Email failed:', err);
    }
};

testEmail();
