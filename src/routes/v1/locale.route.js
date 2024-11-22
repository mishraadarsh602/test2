const express = require("express");
const router = express.Router();
const {
  getLocale,
  createLocale,
  updateLocale,
  deleteLocale,
} = require("../../controllers/localeController");


router.post("/locale", createLocale);


router.get("/locale/:langCode?", getLocale);


router.put("/locale/:langCode", updateLocale);


router.delete("/locale/:langCode", deleteLocale);

module.exports = router;

