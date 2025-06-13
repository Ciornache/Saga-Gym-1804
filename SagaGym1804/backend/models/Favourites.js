const mongoose = require("mongoose");
const favouritesSchema = new mongoose.Schema({
  id_exercitiu: String,
  id_user: String,
});
module.exports = mongoose.model("Favourites", favouritesSchema);
