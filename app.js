const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); // Load environment variables from .env file
}

const methodOverride = require("method-override"); // for PUT/PATCH/DELETE route
const ejsMate = require("ejs-mate");
const session = require("express-session"); //Session Management
const MongoStore = require("connect-mongo"); // Store session in MongoDB
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = process.env.ATLASDB_URL;
main()
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(MONGO_URL);
}

// Middlewares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Session Store
const store = MongoStore.create({
  mongoUrl: MONGO_URL,
  touchAfter: 24 * 3600, // time in seconds after which session will be updated
  crypto: {
    secret: process.env.SECRET,
  },
});

// Error handling for session store
store.on("error", function (e) {
  console.log(" Mongo Session Store Error", e);
});

// Session Management
const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// Session Management Middlewares
app.use(session(sessionOptions));
app.use(flash());

// Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes for Listings
app.use("/listings", listingRouter);

// Routes for Reviews
app.use("/listings/:id/reviews", reviewRouter);

// Routes for SignUp
app.use("/", userRouter);

// TODO
// app.all('*', (req, res, next)=>{
//   next( new ExpressError(404, " Page not found!"));
// });

// Error Handling Middlewares
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { statusCode, message });
  // res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
