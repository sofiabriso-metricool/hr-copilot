require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// DEBUG: Log all requests to help troubleshooting in Render
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// CORS configuration - Ultra-robust to avoid trailing slash mismatches
let rawOrigin = process.env.FRONTEND_URL || '*';
const origins = [rawOrigin];

if (rawOrigin !== '*') {
    if (rawOrigin.endsWith('/')) {
        origins.push(rawOrigin.slice(0, -1));
    } else {
        origins.push(rawOrigin + '/');
    }
}

// Ensure the specific URL from the error is also allowed
if (!origins.includes('https://hr-copilot-mu.vercel.app')) {
    origins.push('https://hr-copilot-mu.vercel.app');
}

const corsOptions = {
    origin: rawOrigin === '*' ? '*' : origins,
    credentials: true,
    optionsSuccessStatus: 200
};

console.log('🛡️ CORS allowed origins:', origins);
app.use(cors(corsOptions));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const pulseRoutes = require('./routes/pulses');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/pulses', pulseRoutes);

app.get('/', (req, res) => {
    res.send('HR Co-pilot API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
