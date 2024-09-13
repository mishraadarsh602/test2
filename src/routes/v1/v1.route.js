const express = require("express");
const router = express.Router();
const { getGtMetrixReport, getCurrentWeather, getAllLocations,createApi,getAllApi} = require('../../controllers/agents');

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "v1#index" });
});
// gtmetrix api route start
router.post('/gtmetrix/start', getGtMetrixReport);
// gtmetrix api route end

// weather api route start
router.get('/weatherApi', getCurrentWeather);
router.get('/locationSearch/:query', getAllLocations);
router.get('/get_all_api',getAllApi)
router.post('/create_api',createApi)

// weather api route end

module.exports = router;