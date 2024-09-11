const express = require('express');
const router = express.Router(); 
const { v1Route,builderRoute,frontendRoute } = require("./v1");

const defaultRoute = [
    { path: "/v1/agents", route: v1Route },
    { path: "/v1/builder", route: builderRoute },
    { path: "/v1/frontend", route: frontendRoute },
];

defaultRoute.forEach((link) => {
    router.use(link.path, link.route);
});
  
module.exports = router;