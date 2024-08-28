const express = require('express');
const router = express.Router(); 
const { v1Route } = require("./v1");

const defaultRoute = [
    { path: "/v1", route: v1Route },
];

defaultRoute.forEach((link) => {
    router.use(link.path, link.route);
});
  
module.exports = router;