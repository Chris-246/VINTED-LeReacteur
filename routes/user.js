const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// importation de cloudinary
const cloudinary = require("cloudinary").v2;

//connexion au serveur cloudinary
cloudinary.config({
  cloud_name: "djnqlxx1a",
  api_key: "138995529323627",
  api_secret: "kcW5tYS7FGT5OtfcXY3tLq8-RY0",
});

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    const emailToSearch = await User.findOne({ email: email });
    if (emailToSearch) {
      res
        .status(409)
        .json({ error: { message: "L'adresse mail renseignée existe déjà." } });
    } else {
      if (username && email && password) {
        const salt = uid2(16);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(16);

        const imageToUpload = req.files.profile_picture.path;
        const imageToShow = await cloudinary.uploader.upload(imageToUpload, {
          folder: "/profilepictures",
        });
        //création du nouveau user + sauvegarde
        const newUser = new User({
          email: email,
          account: {
            username: username,
            phone: phone,
            avatar: imageToShow,
          },
          token: token,
          hash: hash,
          salt: salt,
        });

        await newUser.save();

        // maintenant il faut créer les éléments à retourner
        const reponseClient = {
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        };

        // il faut répondre cet élément au client

        res.json(reponseClient);
      } else {
        res.status(409).json({
          error: { message: "Missing parameters." },
        });
      }
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    //définition de generateHash qui fera la même chose que lors du signup
    const generateHash = (element1, element2) => {
      const elementToReturn = SHA256(element2 + element1).toString(encBase64);
      return elementToReturn;
    };

    //récupération des données à avoir
    const { email, password } = req.fields;
    const userSearch = await User.findOne({ email: email });
    if (userSearch) {
      //on applique le generatehash pour pouvoir le comparer avec celui en base de données
      const hash = generateHash(userSearch.salt, password);
      if (hash === userSearch.hash) {
        const reponseClient = {
          _id: userSearch._id,
          token: userSearch.token,
          account: userSearch.account,
        };
        res.json(reponseClient);
      } else {
        res.status(401).json({
          error: {
            message: "Unauthorized.",
          },
        });
      }
    } else {
      res.status(400).json({
        error: {
          message: "User not found.",
        },
      });
    }
  } catch (error) {
    res.json(error.message);
  }
});

module.exports = router;
