const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  name: { type: String, maxlength: 50 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, max: 100000 },
  details: Array, // brand, size, condition, color, city
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
});

module.exports = Offer;
