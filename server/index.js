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

// CORS configuration
let allowedOrigin = process.env.FRONTEND_URL || '*';
if (allowedOrigin.endsWith('/')) {
    allowedOrigin = allowedOrigin.slice(0, -1);
}

const corsOptions = {
    origin: allowedOrigin === '*' ? '*' : [allowedOrigin],
    credentials: true,
    optionsSuccessStatus: 200
};

console.log('🛡️ CORS allowed origin:', allowedOrigin);
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
