//mongoose
var mongoose = require("mongoose");
//create schema
var Schema = mongoose.Schema;

//schema
var ArticleSchema = new Schema({
    title: {
        type: String, 
        required: true
    },
    link: {
        type: String,
        required: true
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    saved: {
        type: Boolean,
        default: false
    }
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;