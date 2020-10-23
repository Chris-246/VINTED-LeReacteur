const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_KEY_SECRET,
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    //on récupère ci-dessous les valeurs du body renvoyé par le client SANS L'IMAGE
    const {
      name,
      description,
      price,
      brand,
      size,
      condition,
      color,
      city,
    } = req.fields;

    // on populate owner
    const populateOwner = await User.findById(req.user._id).populate("owner");

    //on crée la nouvelle offre
    const newOffer = new Offer({
      name,
      description,
      price,
      details: [
        { brand: brand },
        { size: size },
        { condition: condition },
        { color: color },
        { city: city },
      ],
      owner: populateOwner,
    });

    //ci-dessous on récupère l'image : info importante : newOffer a déjà un id, il est produit dès qu'il y a nouvelle offre
    const imageToUpload = req.files.product_image.path;
    const image = await cloudinary.uploader.upload(imageToUpload, {
      folder: `/vinted/offers/${newOffer._id}`,
    });
    // puis on crée la clé product_image avant d'enregistrer
    newOffer.product_image = image;

    // on enregistre
    await newOffer.save();

    const offerToShow = {
      id: newOffer._id,
      name,
      description,
      price,
      details: [
        { brand: brand },
        { size: size },
        { condition: condition },
        { color: color },
        { city: city },
      ],
      owner: {
        account: newOffer.owner.account,
        _id: req.user._id,
      },
      product_image: image,
    };
    res.json(offerToShow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    const offerToUpdate = await Offer.findById(req.fields.id);
    const {
      name,
      description,
      price,
      brand,
      size,
      condition,
      color,
      city,
    } = req.fields;

    if (offerToUpdate) {
      if (name) {
        offerToUpdate.name = name;
        await offerToUpdate.save();
        res.status(200).json({ message: "Name of article has been changed" });
      } else if (description) {
        offerToUpdate.description = description;
        await offerToUpdate.save();
        res.status(200).json({
          message: "Description of article has been changed",
        });
      } else if (price) {
        offerToUpdate.price = price;
        await offerToUpdate.save();
        res.status(200).json({ message: "Price of article has been changed" });
      } else if (brand) {
        offerToUpdate.details[0].brand = brand;
        await offerToUpdate.save();
        res.status(200).json({
          message: "Brand of article has been changed",
        });
      } else if (size) {
        offerToUpdate.details[1].size = size;
        await offerToUpdate.save();
        res.status(200).json({
          message: "Size of article has been changed",
        });
      } else if (condition) {
        offerToUpdate.details[2].condition = condition;
        await offerToUpdate.save();
        res.status(200).json({
          message: "Condition of article has been changed",
        });
      } else if (color) {
        offerToUpdate.details[3].color = color;
        await offerToUpdate.save();
        res.status(200).json({
          message: "Color of article has been changed",
        });
      } else if (city) {
        offerToUpdate.details[4].city = city;
        await offerToUpdate.save();
        res.status(200).json({
          message: "City of article has been changed",
        });
      } else if (req.files.product_image) {
        const imageToUpload = req.files.product_image.path;
        const imageToUpdate = await cloudinary.uploader.upload(imageToUpload, {
          folder: `/vinted/offers/${req.user._id}`,
        });
        offerToUpdate.product_image = imageToUpdate;
        await offerToUpdate.save();
        res.json({ message: "The image of the article has been changed" });
      } else {
        res.status(400).json({ error: { message: "No modification added" } });
      }
    }
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    const offerToDelete = await Offer.findByIdAndDelete(req.fields.id);
    res.status(200).json({ message: "The article has been deleted" });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
});

router.get("/offer", async (req, res) => {
  try {
    // const offersAll = await Offer.find();
    const { title, priceMin, priceMax, limit, page } = req.query;
    // const limitOffersPerPage = 5;

    const filter = {};

    if (title) {
      filter.name = new RegExp(title, "i");
    }

    if (priceMin && priceMax) {
      filter.price = { $gte: priceMin, $lte: priceMax };
    } else if (priceMin) {
      filter.price = { $gte: priceMin };
    } else if (priceMax) {
      filter.price = { $lte: priceMax };
    }

    const sort = {};

    if (req.query.sort === "price-asc") {
      sort.price = "asc";
    } else if (req.query.sort === "price-desc") {
      sort.price = "desc";
    }

    const limitOfferPerPage = Number(limit);

    const numberOffers = await Offer.countDocuments(filter);

    const maxPages = Math.ceil(numberOffers % limitOfferPerPage);

    const skip = 0;

    const numPages = Number(page);
    if (page) {
      if (numPages > maxPages) {
        res.status(404).json({ error: "Page not found" });
      } else {
        skip = (numPages - 1) * limitOfferPerPage;
      }
    }

    const result = await Offer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitOfferPerPage)
      .populate("owner", "account");
    res.status(200).json({
      offers: numberOffers,
      result: result,
    });
  } catch (error) {
    res.status(401).json({ error: { message: error.message } });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offerById = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    if (offerById) {
      res.status(200).json(offerById);
    } else {
      res.status(400).json({ message: "Not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Not found" });
  }
});

module.exports = router;
