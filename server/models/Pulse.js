const mongoose = require('mongoose');

const PulseSchema = new mongoose.Schema({
    employeeId: { type: Number, required: true },
    type: { type: String, enum: ['manager', 'self'], required: true },
    mood: { type: Number, min: 1, max: 5 },
    alignment: { type: Number, min: 1, max: 5 },
    energy: { type: Number, min: 1, max: 5 },
    blockers: [String],
    comments: String,
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Pulse', PulseSchema);
