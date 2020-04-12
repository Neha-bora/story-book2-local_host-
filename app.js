const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const cookieParser=require('cookie-parser');


//require cookies or session
const session= require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();


//middlewares
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static("public"));




//setup session
app.use(session({
  secret: "our little secret.",
  resave:true,
  saveUninitialized:true
}));


//initialize passport
app.use(passport.initialize());

//use passport
app.use(passport.session());


//flash message middleware
app.use((req , res , next )=>{
  res.locals.message = req.session.message
  delete req.session.message
  next()

});

mongoose.connect(" mongodb://localhost:27017/storyDB", {useNewUrlParser: true , useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
	name:String,
	email:String,
	password:String
});

const secret = "Thisisourlittlesecrete";

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

//passport-local-mongoose
passport.use(User.createStrategy());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));



const postSchema = {
	title:String,
	story:String,
  name:String,
  date:String,
  userId:String
};
const Post = mongoose.model("Post" , postSchema);


app.get("/" , function(req ,res ){

 res.render("home");
});


app.get("/register" , function(req , res){
  res.render("register");
 
});

app.post("/register" , function(req , res){
  const username = req.body.username;
  const name = req.body.name;
   const password = req.body.password ;
 User.register({ username:username,name:name} ,password  , function(err , user){
  if(err){
    console.log(err);
    res.redirect("/register");
  }else{
    passport.authenticate("local")(req , res , function(){
       req.session.message={
         type:'success',
         intro: 'you are now registered!',
         message:'please log in.'
       }

      res.redirect("/stories");
      
    });

  }
 });

});


app.get("/login" , function(req , res){
 
	res.render("login");

});

// app.post("/login" , function( req , res){
//     passport.authenticate('local', function(err, user, info) {
//     if (err) { console.log(err) }
//     if (!user) { return res.redirect('/login'); }
//     req.logIn(user, function(err) {
//       if (err) { console.log(err) }
//       return res.redirect('/stories');
//     });
//   })(req, res);
    

// });

app.post('/login',
  passport.authenticate('local', { successRedirect: '/stories',

                                   failureRedirect: '/login',
                                   

                        })
);

app.get("/logout", function(req , res){
 req.logout();
 res.redirect("/");
});

app.get("/compose" , function(req , res){
  if(req.isAuthenticated()){
     res.render("compose");
   }else{
    res.redirect("/login");
   }
 

});

app.post("/compose" , function( req  , res){
  console.log(req.user);

 const newPost = new Post({
 	title:req.body.postTitle,
 	story:req.body.postBody,
  name:req.user.name,
  date:Date.now(),
  userId:req.user._id
 });
 newPost.save(function(err){
 	if(!err){
 		res.redirect("/stories")
 	}
 });

});

app.get("/stories" , function(req , res){

  if(req.isAuthenticated()){
  Post.find({} , function( err , posts){
  res.render("stories" , { posts:posts});
 
      });
 
   }else{
    res.redirect("/login");
   }
 

});




app.get("/storiesbyName" , function(req , res){
 const requestedStoeyName = req.query.StoryName;
 Post.findOne({title:requestedStoeyName} , function(err , post){
  var date=new Date(parseInt(post.date));
   var formetedDate=date.toDateString();  
 	res.render("specificStory",{
     title:post.title,
     story:post.story,
     name:post.name,
     date:formetedDate
 	});

 	});

});
//myDashboard

app.get("/dashboard" , function(req , res){
  
    if(req.isAuthenticated()){
      Post.find({userId:req.user._id} , function(err , posts){
      res.render("dashboard" , { posts:posts});
    
          });
     
       }else{
        res.redirect("/login");
       }
     
   

  });
 
  app.get("/aboutus" , function(req , res){
    res.render("aboutus");
  });

//updatepost
app.get("/update" , function( req , res){
  var id=req.query.id;
  Post.findOne({_id:id},(err,post)=>{
    res.render("update",{post:post})
    
  })
 
});

app.post("/update" , function(req , res){
      
  var id=req.body.id;
  var updateTitle=req.body.postTitle;
  var updateStory=req.body.postBody;
  Post.updateOne({_id:id},{"$set":{title: updateTitle,story:updateStory}},(err,result)=>{
    if(err){
      console.log(err);
    }else{
      console.log(result);
      res.redirect('/dashboard')
    }

  })
 



});

//deletepost
app.get("/delete/:id" ,function(req , res){
  var id=req.params.id;
  Post.deleteOne({_id:id},(err,result)=>{
    if(err){
      console.log(err);
  }else{
    res.redirect('/dashboard')
  }
  })
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});