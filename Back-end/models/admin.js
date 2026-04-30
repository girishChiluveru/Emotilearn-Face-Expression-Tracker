const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: { type: String, default: 'admin' },
});

const Admin = mongoose.models.admin || mongoose.model('admin', adminSchema);

module.exports = Admin;
