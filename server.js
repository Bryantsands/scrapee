/* Scraping into DB (18.2.5)
 * ========================== */

// Dependencies
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var logger = require("morgan");
var exphbs = require("express-handlebars");

//requiring note and article models
var Article = require("./models/Article.js");
var Comment = require("./models/Comment.js");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

//bluebird promises
var Promise = require("bluebird");

mongoose.Promise = Promise;

//port
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// morgan and body-parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended:false
}));
//static public
app.use(express.static("public"));

//database config using mongoose
mongoose.connect("mongodb://heroku_cr9kh4db:t4484r10uvlvkoj0jl4f34758r@ds117919.mlab.com:17919/heroku_cr9kh4db");
var db = mongoose.connection;

// mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});
//once logged on mongoose put success message
db.once("open", function(){
    console.log("Mongoose connection successful");
});

//Initialize handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// index route
app.get("/", function(req, res) {
//   res.render("index");
  Article.find({}, function(error, doc) {
    var hbsObject = {
        articles: doc
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
});
});

// get for scrape
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("http://www.espn.com/nhl/", function(error, response, html){
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every h1 within an article tag, and do the following:
        $("article h2").each(function(i, element){
            // Save an empty result object
            var result = {};
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");
            // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);
      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });
        });
    });
    // Tell the browser that we finished scraping the text
  // res.send("Scrape Complete");
});
 
 // This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
      var hbsObject = {
        articles: doc
    };
    res.render("index", hbsObject);
    // // Log any errors
    // if (error) {
    //   console.log(error);
    // }
    // // Or send the doc to the browser as a json object
    // else {
    //   res.json(doc);
    // }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id" : req.params.id })
  // ..and populate all of the notes associated with it
  .populate("comment")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});
// Create a new comment or replace an existing comment
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newComment = new Comment(req.body);

  // And save the new comment the db
  newComment.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // // Use the article id to find and update it's note
      // Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      // // Execute the above query
      // .exec(function(err, doc) {
      //   // Log any errors
      //   if (err) {
      //     console.log(err);
      //   }
      //   else {
      //     // Or send the document to the browser
      //     res.send(doc);
       Article.findById(req.params.id, function(error, article) {
                    if(error) {
                        return console.log(error);
                    }
                    if(!article) {
                        return console.log("Couldnt Find the Article!");
                    }
                    // Will return the created ID
                    console.log(article.note);
                    article.save(function(error, updatedArticle) {
                        if(error) {
                            return console.log(error);
                        }
                            res.json(updatedArticle);
      
        })
      });
    }
  });
});

// Listen on PORT
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});