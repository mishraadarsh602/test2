const express = require ('express');
const router = express.Router();
const {getLocale} = require('../../controllers/localeController');
router.get('/get_locale/:langCode?',getLocale);
module.exports = router;
