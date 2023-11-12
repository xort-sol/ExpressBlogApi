var express = require("express");
var router = express.Router();

var User = require("../models/userModel");

// function isadmin(req, res, next) {
//   if (req.user.role === "admin") {
//     next();
//   } else {
//     return res.status(403).json({ message: "Access Denied" });
//   }
// }

// /* GET users listing. */
// router.get("/", isadmin(), function (req, res, next) {
//   res.send("respond with a resource");
// });
// router.get();

module.exports = router;
