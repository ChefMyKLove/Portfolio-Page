const mongoose = require('mongoose');

const InfoPageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InfoPage', InfoPageSchema);
