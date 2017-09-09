var express          = require("express"),
    app              = express(),
    mongoose         = require("mongoose"),
    bodyParser       = require("body-parser"),
    expressSanitizer = require("express-sanitizer"),
    methodOverride   = require('method-override');

mongoose.connect("mongodb://localhost/todo_app");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.set("view engine", "ejs");
app.use(methodOverride('_method'));

var todoSchema = new mongoose.Schema({
  text: String,
});

var Todo = mongoose.model("Todo", todoSchema);

app.get("/", function(req, res){
  res.redirect("/todos");
});

// function to be used in the .get("/todos", ..) route
// this allows us to escape any special characters with a backslash
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

app.get("/todos", function(req, res){
  if(req.query.keyword) {   // if there's a query string called keyword then..
    // set the constant (variable) regex equal to a new regular expression created from the keyword
    // that we pulled from the query string
    const regex = new RegExp(escapeRegex(req.query.keyword), 'gi');
    // query the database for Todos with text property that match the regular expression version of the search keyword
    Todo.find({ text: regex }, function(err, todos){
      if(err){
        console.log(err);
      } else {
      	// send back the todos we found as JSON
        res.json(todos);
      }
    });
  } else {
  	// if there wasn't any query string keyword then..
    Todo.find({}, function(err, todos){ // query the db for all todos
      if(err){
        console.log(err);
      } else {
        if(req.xhr) { // if request was made with AJAX then ..
          res.json(todos); // send back all todos as JSON
        } else {
          res.render("index", {todos: todos}); // otherwise render the index view and pass in all todos with EJS
        }
      }
    });
  }
});

app.get("/todos/new", function(req, res){
 res.render("new");
});

app.post("/todos", function(req, res){
 req.body.todo.text = req.sanitize(req.body.todo.text);
 var formData = req.body.todo;
 Todo.create(formData, function(err, newTodo){
    if(err){
      res.render("new");
    } else {
      res.json(newTodo);
    }
  });
});

app.get("/todos/:id/edit", function(req, res){
 Todo.findById(req.params.id, function(err, todo){
   if(err){
     console.log(err);
     res.redirect("/")
   } else {
      res.render("edit", {todo: todo});
    }
 });
});

app.put("/todos/:id", function(req, res){
 Todo.findByIdAndUpdate(req.params.id, req.body.todo, {new: true}, function(err, todo){
   if(err){
     console.log(err);
   } else {
     res.json(todo);
   }
 });
});

app.delete("/todos/:id", function(req, res){
 Todo.findByIdAndRemove(req.params.id, function(err, todo){
   if(err){
     console.log(err);
   } else {
     res.json(todo);
   }
 });
});


app.listen(3000 || process.env.PORT, process.env.IP, function() {
  console.log('Server running on port 3000');
});
