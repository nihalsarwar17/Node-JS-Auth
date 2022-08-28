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

app.use(
  session({
    secret: "sdufg", // cookie secret key
    resave: true, // store session ID
    saveUninitialized: true, // creates and stores session object
  }),
  passport.initialize(),
  passport.session()
);

app.set("view engine", "pug");
app.set("views", "./pages");

mongo.connect(URI, (error, client) => {
  if (error) {
    console.log(error);
  } else {
    const db = client.db("AdvancedNode");
    app.listen(3000, () => {
      console.log("server is running on 3000 port");
      console.log("Connected to the database");
    });
    app.get("/", (req, res) => {
      console.log(req.session);
      res.render("homepage", { message: "Please sign in to proceed" });
    });
    
    // Save User ID in a cookie
    // user is the mongoDB collection where users data is stored
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    
    // take user ID from cookie and retrieve user's data
    passport.deserializeUser((userId, done) => {
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
  } // else bracket
});


