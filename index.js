const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(formidable());
app.use(cors());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_KEY_SECRET,
});

// importation des routes ci-dessous
const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

//connexion à la BDD mongo
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.all("*", (req, res) => {
  res.json("Cette route n'existe pas");
});

app.listen(process.env.PORT, () => {
  console.log(`Server started with port : ${process.env.PORT}`);
});
