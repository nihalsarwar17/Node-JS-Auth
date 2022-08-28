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

app.get('/', (req, res)=>{
  res.render('homepage', {message: "Please sign in to proceed"})
})

app.listen(3000, ()=>{