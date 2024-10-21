const express = require("express");
const router = express.Router();
const adminController = require('../../../controllers/admin/dashboard');
// const auth = require('../../../middleware/auth');

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "frontend#index" });
});

router.get('/getfeatureLists',adminController.getFeatureLists);
module.exports = router;