var express = require("express");
var router = express.Router();

/* GET home page. */

router.get("/", function (req, res, next) {
  res.json({ state: "success" });
});

router.use("/user", require("./user"));
router.use("/meeting", require("./meeting"));
router.use("/feedback", require("./feedback"));
router.use("/qrcode", require("./qrcode"));

module.exports = router;
