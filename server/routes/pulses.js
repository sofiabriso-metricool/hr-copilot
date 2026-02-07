const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Pulse = require('../models/Pulse');
const Employee = require('../models/Employee');
const nodemailer = require('nodemailer');

// Helper to send email
const sendPulseEmail = async (email, name, link) => {
    const { EMAIL_USER, EMAIL_PASS } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
        console.error('❌ EMAIL ERROR: Missing EMAIL_USER or EMAIL_PASS');
        throw new Error('Variables de entorno EMAIL_USER o EMAIL_PASS no configuradas en Render.');
    }

    console.log(`📧 Intentando enviar email a: ${email}...`);

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS // Debe ser una Contraseña de Aplicación de 16 letras
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        debug: true, // Show debug output
        logger: true // Log information in console
    });

    let mailOptions = {
        from: `"HR Co-pilot" <${EMAIL_USER}>`,
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
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado con éxito:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error detallado de Nodemailer:', error);
        throw error;
    }
};

// @route   POST api/pulses/request
// @desc    Manager requests a pulse from employee (sends email)
router.post('/request', auth, async (req, res) => {
    const { employeeId } = req.body;
    try {
        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        const token = Buffer.from(`${employee.email}:${employee.id}`).toString('base64');
        const pulseLink = `${process.env.FRONTEND_URL}/?pulse_token=${token}`;

        await sendPulseEmail(employee.email, employee.name, pulseLink);
        res.json({ msg: 'Email sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error sending email', error: err.message });
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
