const express = require("express");
const router = express.Router();
const liveController = require('../../controllers/live');
router.get('/:url', liveController.getLivePreview);
module.exports = router;