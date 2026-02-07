require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

console.log('--- SERVER STARTING (Version: CORSReflect) ---');

// DEBUG: Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// ULTRA-RESILIENT CORS: Reflect incoming origin to avoid any string mismatches
const corsOptions = {
    origin: function (origin, callback) {
        // If it's a request from our own tools (no origin) or our domains, allow it
        if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true); // This will set Access-Control-Allow-Origin to the exact 'origin' string
        } else {
            // Check against FRONTEND_URL as final fallback
            const feUrl = process.env.FRONTEND_URL;
            if (feUrl && (origin === feUrl || origin === feUrl.replace(/\/$/, ''))) {
                callback(null, true);
            } else {
                console.warn(`🔒 CORS Blocked for origin: ${origin}`);
                callback(null, false);
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

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
    res.send('HR Co-pilot API is running (CORSReflect)...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
