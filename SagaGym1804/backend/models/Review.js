const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  exerciseId: String,
  rating: Number,
  comment: String
}, {
  timestamps: true   // ⬅️ adaugă asta dacă lipsește!
});

module.exports = mongoose.model("Review", schema);