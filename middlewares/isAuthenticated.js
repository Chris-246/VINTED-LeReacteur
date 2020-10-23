const express = require("express");
const User = require("../models/User");
const app = express();

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      const user = await User.findOne({ token: token });
      if (!user) {
        res.status(401).json({ error: { message: "Unauthorized" } });
      } else {
        req.user = user;
        return next();
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
};

module.exports = isAuthenticated;
