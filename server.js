const { response, request } = require("express");
const express = require("express");
const pug = require("pug");
const app = express();
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");
const ObjectId = require("mongodb").ObjectId;
const URI = "mongodb://localhost:27017/AdvancedNode";
const mongo = require("mongodb").MongoClient; // mongo connects with the databases

app.set("view engine", "pug");
app.set("views", "./pages");

app.use(
  session({
    secret: "sdufg",
    resave: true,
    saveUninitialized: true,
  }),
  passport.initialize(),
  passport.session()
);

// connect with the database
mongo.connect(URI, (error, client) => {
  if (error) {
    console.log(error);
  } else {
    const db = client.db("AdvancedNode");
    app.listen(3000, () => {
      console.log("server is running on 3000 port");
      console.log("Connected to the database");
    });

    // *********************** ROUTES ****************************
    app.get("/", (request, res) => {
      request.session.count++; // every time page reloads, it increments the count
      console.log(request.session);

      res.render("login", {
        website_msg: "FanClub is excited to have you with us!",
      });
    });

    app.get("/failure", (request, resp) => {
      resp.render("failure", {
        website_msg: "Try again to login!",
      });
    });

    app.get("/profile", function (req, res, next) {
      res.render("user", { userName: req.user.name, image: req.user.picture });
    });

    // *********************** ROUTES ENDED ****************************

    // ================= store User ID in cookie ===================

    // save User ID in a cookies
    // user => stores all properties of user data
    // done => determine what user data should store in the cookie from the user object

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    // Retrieve User ID from the cookie
    passport.deserializeUser((userId, done) => {
      // open 'users' named collection in database and
      db.collection("users").findOne(
        // userId retrieves the ID from the cookie and assign it to an object
        // so it could find the user details from the collection to its corresponding ID
        { _id: new ObjectId(userId) },

        // once it matches the ID then it retrieves all the user info
        (error, doc) => {
          // doc has the detailed info of users
          done(null, doc);
        }
      );
    });

    const findUserDocument = new LocalStrategy((username, password, done) => {
      db.collection("users").findOne(
        { username: username },
        // user has all the info of the user
        (err, user) => {
          if (err) {
            return done(err);
          }
          // if user is not there
          else if (!user) {
            // send authentication error
            done(null, false);
          } else if (user.password !== password) {
            // send authentication error
            done(null, false);
          } else {
            done(null, user);
          }
        }
      );
    });

    // take username and password and verifies them and return the user info
    passport.use(findUserDocument);

    app.use(
      bodyParser.urlencoded({
        extended: false,
      })
    );

    app.post(
      "/user/submit",
      passport.authenticate("local", { failureRedirect: "/failure" }),
      function (req, res) {
        // res.redirect("/profile");
        var username = req.body.username;
        res.redirect("/profile");
      }
    );

    // let isSignedIn = (req, res, next) => {
    //   if (req.isAuthenticated()) {
    //     // if user signed in
    //     next();
    //   } else {
    //     // if user doesn't signed in
    //     res.redirect("/");
    //   }
    // };

    // app.get("/profile", isSignedIn, function (req, res, next) {
    //   res.render("user", { userName: req.user.name, image: req.user.picture });
    // });
  }
});
