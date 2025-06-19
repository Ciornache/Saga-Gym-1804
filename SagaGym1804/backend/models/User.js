const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    gender: String,
    interval_varsta: String,
    body_type: String,
    phone_number: String,
    height: Number,
    weight: Number,
    nivel_fitness: String,
    pfp_picture: {
      type: String,
      default: "", 
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
