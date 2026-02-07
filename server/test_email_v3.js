require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('Testing with User:', process.env.EMAIL_USER);

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: `"HR Co-pilot" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: 'Nodemailer Test v3',
        text: 'STARTTLS config test'
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.response);
    } catch (err) {
        console.error('❌ Email failed:', err);
    }
};

testEmail();
