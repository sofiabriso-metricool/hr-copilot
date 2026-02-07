const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

// @route   GET api/employees
// @desc    Get all employees for the user's company
router.get('/', auth, async (req, res) => {
    try {
        const user = await Employee.findOne({ id: req.user.id });
        const employees = await Employee.find({ companyId: user.companyId });
        res.json(employees);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/employees/subordinates/:managerId
// @desc    Get all subordinates for a manager
router.get('/subordinates/:managerId', auth, async (req, res) => {
    try {
        const managerId = parseInt(req.params.managerId);
        const subordinates = await Employee.find({ managerId });
        res.json(subordinates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/employees
// @desc    Add a new employee
router.post('/', auth, async (req, res) => {
    const { name, role, avatar, email, password, managerId } = req.body;
    try {
        const admin = await Employee.findOne({ id: req.user.id });

        let employee = await Employee.findOne({ email });
        if (employee) return res.status(400).json({ msg: 'Employee already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        employee = new Employee({
            name,
            role,
            avatar,
            email,
            password: hashedPassword,
            managerId: managerId || req.user.id,
            companyId: admin.companyId,
            status: 'ok',
            statusHistory: ['ok'],
            id: Date.now()
        });

        await employee.save();
        res.json(employee);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/employees/:id/checklist
// @desc    Toggle a checklist item
router.post('/:id/checklist', auth, async (req, res) => {
    const { resId, stepIndex } = req.body;
    try {
        let employee = await Employee.findOne({ id: req.params.id });
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        const checklists = employee.checklists || {};
        const currentSteps = checklists[resId] || [];

        if (currentSteps.includes(stepIndex)) {
            checklists[resId] = currentSteps.filter(s => s !== stepIndex);
        } else {
            checklists[resId] = [...currentSteps, stepIndex];
        }

        employee.checklists = checklists;
        employee.markModified('checklists');
        await employee.save();
        res.json(employee.checklists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/employees/me
// @desc    Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await Employee.findOne({ id: req.user.id }).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee
router.delete('/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findOne({ id: req.params.id });
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        // Check if employee has subordinates before deleting (optional/policy)
        const hasSubordinates = await Employee.exists({ managerId: employee.id });
        if (hasSubordinates) {
            return res.status(400).json({ msg: 'Cannot delete employee with active subordinates' });
        }

        await Employee.deleteOne({ id: req.params.id });
        res.json({ msg: 'Employee removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
