const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const  userController = require("../controllers/users.js");

// Sign up routes
router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

// Log in routes
router.route("/login")
.get(userController.renderLoginForm)
.post(
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  userController.login
)

router.get("/logout",userController.logout);

module.exports = router;
