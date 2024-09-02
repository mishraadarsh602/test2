const express = require("express");
const router = express.Router();
const { getGtMetrixReport, getCurrentWeather, getAllLocations,createApp,updateApp, fetchAppById } = require('../../controllers/agents');

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "v1#index" });
});
//createAPP API
router.post("/createApp",createApp);
router.get("/fetchAppById",fetchAppById);
router.put("/updateApp",updateApp);
// gtmetrix api route start
router.post('/gtmetrix/start', getGtMetrixReport);
// gtmetrix api route end

// weather api route start
router.get('/weatherApi', getCurrentWeather);
router.get('/locationSearch/:query', getAllLocations);
// weather api route end

module.exports = router;