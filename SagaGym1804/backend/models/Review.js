const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  exerciseId: String,
  userEmail:  String,           
  rating: Number,
  comment: String,
  likes: [String]              
}, {
  timestamps: true
});

module.exports = mongoose.model("Review", schema);
