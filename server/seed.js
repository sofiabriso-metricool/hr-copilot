require('dotenv').config();
const dns = require('dns');
if (dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');
const Pulse = require('./models/Pulse');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Employee.deleteMany({});
        await Pulse.deleteMany({});

        const hashedPassword = await bcrypt.hash('123', 10);
        const companyId = 300;

        // 1. CEO
        const ceo = await Employee.create({
            id: 1,
            name: 'Carlos Rodriguez',
            email: 'carlos@novacorp.com',
            password: hashedPassword,
            role: 'CEO & Founder',
            avatar: '👑',
            isAdmin: true,
            companyId,
            status: 'ok',
            statusHistory: ['ok', 'ok', 'ok']
        });

        // 2. Managers (Reporting to CEO)
        const managers = [];
        const managerData = [
            { id: 2, name: 'Elena Gomez', email: 'elena@novacorp.com', role: 'Head of Engineering', avatar: '👩‍💻' },
            { id: 3, name: 'Marc Torres', email: 'marc@novacorp.com', role: 'Head of Marketing', avatar: '🎨' },
            { id: 4, name: 'Sara Ruiz', email: 'sara@novacorp.com', role: 'Head of Operations', avatar: '👩‍💼' }
        ];

        for (const data of managerData) {
            const m = await Employee.create({
                ...data,
                password: hashedPassword,
                managerId: ceo.id,
                companyId,
                status: 'ok',
                statusHistory: ['ok']
            });
            managers.push(m);
        }

        // 3. Employees (Reporting to Managers)
        const employeeData = [
            // Engineering Team (Under Elena)
            { id: 10, name: 'David Sanz', email: 'david@novacorp.com', role: 'Fullstack Dev', avatar: '🚀', managerId: 2 },
            { id: 11, name: 'Laura Font', email: 'laura@novacorp.com', role: 'iOS Dev', avatar: '📱', managerId: 2 },
            { id: 12, name: 'Ivan Rius', email: 'ivan@novacorp.com', role: 'Backend Lead', avatar: '🧠', managerId: 2 },
            { id: 13, name: 'Paula Sole', email: 'paula@novacorp.com', role: 'QA Engineer', avatar: '🔍', managerId: 2 },

            // Marketing Team (Under Marc)
            { id: 20, name: 'Oscar Pla', email: 'oscar@novacorp.com', role: 'Content Creator', avatar: '📸', managerId: 3 },
            { id: 21, name: 'Julia Mas', email: 'julia@novacorp.com', role: 'Growth Hacker', avatar: '📈', managerId: 3 },
            { id: 22, name: 'Toni Blau', email: 'toni@novacorp.com', role: 'Designer', avatar: '🎨', managerId: 3 },

            // Operations Team (Under Sara)
            { id: 30, name: 'Marta Sol', email: 'marta@novacorp.com', role: 'HR specialist', avatar: '👩‍💼', managerId: 4 },
            { id: 31, name: 'Pere Pou', email: 'pere@novacorp.com', role: 'Financial Analyst', avatar: '📊', managerId: 4 },
            { id: 32, name: 'Anna Ros', email: 'anna@novacorp.com', role: 'Customer Success', avatar: '💬', managerId: 4 },
            { id: 33, name: 'Ramon Gil', email: 'ramon@novacorp.com', role: 'Recruiter', avatar: '🤝', managerId: 4 }
        ];

        for (const data of employeeData) {
            await Employee.create({
                ...data,
                password: hashedPassword,
                companyId,
                status: 'ok',
                statusHistory: ['ok']
            });
        }

        console.log('✅ Seed successful: NovaCorp created with 1 CEO, 3 Managers and 11 Employees.');
        console.log('Credentials: All passwords are "123"');
        console.log('- CEO: carlos@novacorp.com');
        console.log('- Manager (Eng): elena@novacorp.com');
        console.log('- Employee (Dev): david@novacorp.com');

        process.exit();
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
};

seedData();
