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
          // doc has all the info of user
          done(null, doc);
        }
      );
    });

    const findUserDocument = new LocalStrategy((username, password, done) => {
      db.collection("users").findOne(
        { username: username },
        // user object has all the info of the logged in user
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

    // checks user status
    // if not logged in then redirect user to login page
    let isSignedIn = (req, res, next) => {
      if (req.isAuthenticated()) {
        // if user signed in (cookie exists)
        // console.log("user's cookie: " + req.session.passport.user); // cookie Id
        next();
      } else {
        // if user doesn't signed in
        res.redirect("/"); // (cookie doesn't exist)
      }
    };

    // *********************** ROUTES ****************************
    app.get("/", (req, res) => {
      // req.session.count++; // every time page reloads, it increments the count
      // console.log(req.session);

      res.render("login", {
        website_msg: "FanClub is excited to have you with us!",
      });
    });

    app.get("/signup", (req, res) => {
      res.render("signup", {
        // website_msg: "Something went wrong, Login again!",
      });
    });

    app.get("/login-failed", (req, res) => {
      res.render("failure", {
        website_msg: "Something went wrong, Login again!",
      });
    });

    app.get("/reg-failed", (req, res) => {
      res.render("failure", {
        website_msg: "Something went wrong, Signup again!",
      });
    });

    app.get("/profile", isSignedIn, function (req, res, next) {
      res.render("user", { userName: req.user.name, image: req.user.picture });
    });

    // can't open profile after logout
    app.get("/logout", function (req, res, next) {
      req.logout(function (err) {
        // do this
        if (err) {
          return next(err);
        } // do this
        res.redirect("/");
      });
    });

    // *********************** ROUTES ENDED ****************************

    // *********************** Post APIs ****************************
    app.post(
      "/user/submit",
      passport.authenticate("local", { failureRedirect: "/login-failed" }),
      function (req, res) {
        // console.log(req.user)
        var username = req.body.username;
        res.redirect("/profile");
      }
    );

    app.post(
      "/register",
      bodyParser.urlencoded({ extended: false }),
      (req, res, next) => {
        // check if user exists with same username or not
        db.collection("users").findOne(
          { username: req.body.username },
          (err, user) => {
            // if there's no error AND username exists
            if (!err && user) {
              res.redirect("/");
            }
          }
        );
        // Else creates User 
        db.collection("users").insertOne(
          {
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
            picture: req.body.picture,

          },
          (err, createdUser)=>{
            if(!err && createdUser){
              next()
            }
          }
        )
      },
      passport.authenticate("local", { failureRedirect: "/reg-failed" }),
      (req, res)=>{
        res.redirect('/profile')
      }
    );

    // *********************** Post APIs Ended ****************************

    // when wrong Route OR URL puts in
    app.use((req, res) => {
      res.status(404).type("text").send("URL NOT FOUND");
    });

  } // else bracket closed
});
