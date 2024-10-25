const express = require('express');
const router = express.Router(); 
const { v1Route,builderRoute,frontendRoute,liveRoute,analytic,adminRoute,userRoute ,} = require("./v1");

const defaultRoute = [
    { path: "/v1/agents", route: v1Route },
    { path: "/v1/builder", route: builderRoute },
    { path: "/v1/frontend", route: frontendRoute },
    { path: "/v1/live", route: liveRoute },
    {path:'/v1/analytic',route:analytic},
    {path:'/v1/admin',route:adminRoute},
    {path:'/v1/admin',route:userRoute}
];

defaultRoute.forEach((link) => {
    router.use(link.path, link.route);
});
  
module.exports = router;