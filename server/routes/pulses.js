const express = require('express');
const router = express.Router();
require('dotenv').config();
const auth = require('../middleware/auth');
const Pulse = require('../models/Pulse');
const Employee = require('../models/Employee');
const nodemailer = require('nodemailer');

// Helper to send email
const sendPulseEmail = async (email, name, link) => {
    const { EMAIL_USER, EMAIL_PASS, RESEND_API_KEY } = process.env;

    // 1. Prioritize Resend (HTTP API - Recommended for Render)
    if (RESEND_API_KEY) {
        console.log(`🚀 Using Resend API for email to ${email}`);
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'HR Co-pilot <onboarding@resend.dev>', // Default for free tier
                    to: email,
                    subject: 'HR Co-pilot: Tu Pulso de Salud Laboral',
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <h2 style="color: #6366f1;">Hola ${name},</h2>
                        <p>Queremos saber cómo te sientes hoy para asegurarnos de que todo va bien.</p>
                        <p>Por favor, rellena tu pulso haciendo clic en el siguiente botón:</p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${link}" style="padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Rellenar mi Pulso 🚀</a>
                        </div>
                        <p style="color: #64748b; font-size: 0.9rem;">Este es un mensaje automático de HR Co-pilot. ¡Gracias por tu sinceridad!</p>
                      </div>
                    `
                })
            });

            if (response.ok) {
                console.log('✅ Resend: Email sent');
                return;
            } else {
                const errorData = await response.json();
                console.error('❌ Resend Error:', errorData);
            }
        } catch (error) {
            console.error('❌ Resend Runtime Error:', error.message);
            // Fallback to SMTP if Resend fails
        }
    }

    // 2. Fallback to Nodemailer (SMTP)
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.error('❌ EMAIL ERROR: Missing credentials');
        return; // Silent fail to allow link fallback in UI
    }

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        tls: { rejectUnauthorized: false }
    });

    let mailOptions = {
        from: `"HR Co-pilot" <${EMAIL_USER}>`,
        to: email,
        subject: 'HR Co-pilot: Tu Pulso de Salud Laboral',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <p>Hola ${name}, rellena tu pulso aquí: <a href="${link}">${link}</a></p>
          </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ SMTP: Email sent');
    } catch (error) {
        console.error('❌ SMTP Error:', error.message);
    }
};

// @route   POST api/pulses/request
// @desc    Manager requests a pulse from employee (sends email)
router.post('/request', auth, async (req, res) => {
    const { employeeId } = req.body;
    try {
        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        const frontendUrl = process.env.FRONTEND_URL || 'https://tu-app.vercel.app';
        const token = Buffer.from(`${employee.email}:${employee.id}`).toString('base64');
        const pulseLink = `${frontendUrl}/?pulse_token=${token}`;

        // FIRE AND FORGET: Start sending email but DON'T wait for it.
        // This prevents Render's timeout and the "Network Error".
        sendPulseEmail(employee.email, employee.name, pulseLink).catch(err => {
            console.error("Async Email Error:", err.message);
        });

        // Always return success and the link immediately
        res.json({
            msg: 'Preparando envío... He generado el link manual por si el email falla.',
            pulseLink
        });
    } catch (err) {
        console.error("Request pulse error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/pulses/manager
// @desc    Manager records a pulse for employee
router.post('/manager', auth, async (req, res) => {
    const { employeeId, mood, alignment, energy, blockers, comments } = req.body;
    try {
        const pulse = new Pulse({
            employeeId,
            type: 'manager',
            mood,
            alignment,
            energy,
            blockers,
            comments
        });
        await pulse.save();

        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        // Calculate status
        let status = 'ok';
        const blockerCount = blockers?.length || 0;
        if (mood <= 2 || alignment <= 2 || energy <= 2 || blockerCount >= 2) status = 'risk';
        else if (mood === 3 || alignment === 3 || energy === 3 || blockerCount === 1) status = 'attention';

        employee.status = status;
        employee.statusHistory.push(status);
        employee.lastPulse = { mood, alignment, energy, blockers, comments, date: new Date() };

        await employee.save();
        res.json(pulse);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error recording pulse');
    }
});

// @route   POST api/pulses/self
// @desc    Employee records their own pulse
router.post('/self', auth, async (req, res) => {
    const { mood, alignment, energy, blockers, comments } = req.body;
    try {
        const employeeId = req.user.id;
        const pulse = new Pulse({
            employeeId,
            type: 'self',
            mood,
            alignment,
            energy,
            blockers,
            comments
        });
        await pulse.save();

        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        // Re-calculate status (Simplified)
        let status = 'ok';
        const blockerCount = (employee.lastPulse?.blockers?.length || 0) + (blockers?.length || 0);
        const avgMood = (mood + (employee.lastPulse?.mood || mood)) / 2;

        if (avgMood <= 2.5 || blockerCount >= 2) status = 'risk';
        else if (avgMood <= 3.5 || blockerCount >= 1) status = 'attention';

        employee.status = status;
        employee.statusHistory.push(status);
        employee.lastSelfPulse = { mood, alignment, energy, blockers, comments, date: new Date() };

        await employee.save();
        res.json(pulse);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error recording pulse');
    }
});

module.exports = router;
