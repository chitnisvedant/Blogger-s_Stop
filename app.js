//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require("lodash");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

const posts = [];
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let logged = false;

//Setting connections with database using mongoose...

mongoose.connect('mongodb+srv://chitnisvedant:123@cluster0.e8lbs.mongodb.net/blogDB');

const authSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'No Email']
  },
  password: {
    type: String,
    required: [true, 'No Password']
  }
})

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'No Title']
  },
  content: {
    type: String,
    required: [true, 'No Content']
  }
})

const blogModel = mongoose.model('post', blogSchema);
const authModel = mongoose.model('user', authSchema);


/*          Authenticating the user.             */
app.get('/', function(req,res){
  res.render('homeAuth');
})

app.get('/register', function(req, res){
  res.render('registerAuth');
})

app.get('/login', function(req, res){
  res.render('loginAuth');
})

app.get('/logout', function(req, res){
  logged = false;
  res.redirect('/login');
})

app.post('/register', function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const obj = new authModel({
      username: req.body.username,
      password: hash
    })

    obj.save(function(err){
      if(!err){
        blogModel.find(function(err, arrOfBlogs){
          logged = true;
          res.render("homeBlog", {homeContent: homeStartingContent, posts: arrOfBlogs});
        })
      }
      else{
        res.redirect('/');
      }
    })
  });

})

app.post('/login', function(req,res){
  authModel.findOne({username: req.body.username}, function(err, foundUser){
    if(foundUser){
      bcrypt.compare(req.body.password, foundUser.password, function(err, result){
          if(result===true){
            logged = true;
            blogModel.find(function(err, arrOfBlogs){
              res.redirect('/homeBlog');
            })
          }
          else{
            res.redirect('/');
          }
      });
    }
    else{
      res.redirect('/');
    }
  })
})

/* Authentication done and a boolean variable 'logged' is set to check
whether Authentication at particular step is done or not    */




/***********  Idea: TodoList -> Comments/ Suggestions section starts *********/
//Main Comment List
const listSchema = new mongoose.Schema({
  item: String
})

//Custom comments List
const commentListSchema = new mongoose.Schema({
  name: String,
  lists: [listSchema]
})

const commentModel = mongoose.model('comment', commentListSchema);
const listModel = mongoose.model('list', listSchema);

let commentListName = "";

app.get("/homeBlog/comments/:commentListName", function(req,res){

    if(logged)
    {
        commentListName = lodash.capitalize(req.params.commentListName);

        commentModel.findOne({name: commentListName}, function(err, foundList){

          if(!foundList)
          {
    //If list not found, we will create a new comment section, with Title as the Title of blog(commentListName = foundList.name).
              const newCommentList = new commentModel({
                  name: commentListName,
                  lists: []
              })

              newCommentList.save(function(err){
                  if(!err){
                      console.log("Successfully created a new List.");
                  }
                  else{
                      console.log(err);
                  }
              })

              res.redirect("/homeBlog/comments/"+commentListName);
          }

          else
          {
    //List found, so we will simply display it.
            res.render('list.ejs', {listTitle: foundList.name, newListItems: foundList.lists})
          }
       })
     }
     else
     {
       res.redirect('/login');
     }
})


app.post("/homeBlog/comments/postComments", function(req, res){

  const newListItemBasedOnListSchema = new listModel({
    item: req.body.newItem
  })

  commentModel.findOne({name: req.body.list}, function(err, foundList){
      if(!err){
        foundList.lists.push(newListItemBasedOnListSchema);
        foundList.save(function(err){
          if(!err){
            res.redirect('/homeBlog/comments/' + req.body.list);
          }
          else{
            console.log(err);
          }
        });
      }
      else{
        console.log(err);
      }
    })
})
/***********      Comments/ Suggestions section ends       ************/




/****   Using express routes to handle GET/ POST requests   *****/
app.get("/homeBlog", function(req,res){
  if(logged)
  {
    blogModel.find(function(err, arrOfBlogs){
      res.render("homeBlog", {homeContent: homeStartingContent, posts: arrOfBlogs});
    })
  }
  else
  {
    res.redirect('/login');
  }
})

app.get("/about", function(req,res){
  res.render("about", {aboutContent: aboutContent});
})

app.get("/contact", function(req,res){
  res.render("contact", {contactContent: contactContent});
})

app.get("/compose", function(req,res){
  if(logged){
    res.render("compose");
  }
  else{
    res.redirect('/login');
  }
})

app.get("/posts/:number", function(req,res){
  blogModel.find(function(err, arrOfBlogs){
    for(let i=0;i<arrOfBlogs.length;i++)
    {
      if(lodash.lowerCase(req.params.number) === lodash.lowerCase(arrOfBlogs[i]._id))
      {
        res.render("post", {postTitleName: arrOfBlogs[i].title, postContent: arrOfBlogs[i].content});
      }
    }
  })
})

app.post("/compose", function(req,res){
  let post1 = new blogModel({
    title: req.body.postTitle,
    content: req.body.postBody
  })

  post1.save(function(err){
    if(!err){
      res.redirect("/homeBlog");
    }
  });
})

/******** Blog Website Complete, with Authentication,
Comments/ Suggestions section for each blog (Idea - TodoList)********/


// Listening on local as well as external port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server is running successfully.");
});
