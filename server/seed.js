require('dotenv').config();
const dns = require('dns');
if (dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Employee.deleteMany({});

        const hashedPassword = await bcrypt.hash('123', 10);

        const sofia = await Employee.create({
            id: 1,
            name: 'Sofia Soler',
            email: 'sofiabriso@metricool.com',
            password: hashedPassword,
            role: 'CEO & Founder',
            avatar: '👑',
            isAdmin: true,
            companyId: 202,
            status: 'ok',
            statusHistory: ['ok', 'ok', 'ok']
        });

        const jose = await Employee.create({
            id: 102,
            name: 'José',
            email: 'moliner.jose@gmail.com',
            password: hashedPassword,
            role: 'Design Lead',
            avatar: '🎨',
            managerId: sofia.id,
            companyId: 202,
            status: 'ok',
            statusHistory: ['ok']
        });

        console.log('✅ Seed successful: Sofia and José created.');
        process.exit();
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
};

seedData();
