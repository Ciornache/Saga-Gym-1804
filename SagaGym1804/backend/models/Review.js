const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  exerciseId: Number,
  userEmail:  String,           
  rating: Number,
  comment: String,
  likes: [String]              
}, {
  timestamps: true
});

module.exports = mongoose.model("Review", schema);
