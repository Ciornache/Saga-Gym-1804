// backend/models/Contact.js

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String },
  message:   { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);
