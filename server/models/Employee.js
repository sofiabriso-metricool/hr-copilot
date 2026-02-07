const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, default: '👨‍💼' },
    status: { type: String, enum: ['ok', 'attention', 'risk'], default: 'ok' },
    managerId: { type: Number, default: null },
    isAdmin: { type: Boolean, default: false },
    cadenceDays: { type: Number, default: 15 },
    statusHistory: [{ type: String, enum: ['ok', 'attention', 'risk'] }],
    lastPulse: {
        mood: Number,
        alignment: Number,
        energy: Number,
        blockers: [String],
        comments: String,
        date: Date
    },
    lastSelfPulse: {
        mood: Number,
        alignment: Number,
        energy: Number,
        blockers: [String],
        comments: String,
        date: Date
    },
    companyId: { type: Number, required: true },
    id: { type: Number, required: true, unique: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
