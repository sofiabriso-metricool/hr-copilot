require('dotenv').config();
const dns = require('dns');
if (dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const verifyData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const employees = await Employee.find({});
        console.log('--- DATABASE DUMP ---');
        employees.forEach(e => {
            console.log(`ID: ${e.id}, ObjectId: ${e._id}, Name: ${e.name}, Email: ${e.email}, ManagerId: ${e.managerId}, CompanyId: ${e.companyId}, IsAdmin: ${e.isAdmin}`);
        });
        console.log('---------------------');
        process.exit();
    } catch (err) {
        console.error('❌ Verify failed:', err);
        process.exit(1);
    }
};

verifyData();
