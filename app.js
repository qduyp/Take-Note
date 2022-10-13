//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin:admin@cluster0.fvdffd8.mongodb.net/todolistDB');

const defaultItems = [{name : "Welcom to your todolist"},
                      {name : "Hit the '+' to add new item"},
                      {name : "<--- Hit this to delete an item"}];

const itemsSchema = ({
  name : String
});
const Item = mongoose.model("Item",itemsSchema)

const listSchema = {
  name : String,
  items : [itemsSchema]
};
const List  = mongoose.model("List", listSchema);

// Default Route
app.get("/", function(req, res) {
  Item.find(function(err, foundItems){
    if(!err){
      if(foundItems.length === 0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log("Insert error");
          }else{
            console.log("Default items inserted");
          }
        });

        res.redirect("/");
      }
      else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  })
});

//Custom Route
app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);
  const list = new List({
    name : customListName,
    items : defaultItems
  });
  List.findOne({name : customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  });
});


// Add new Item Route
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

//Delete Item Route
app.post("/delete",function(req, res){
  const checkbox = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.deleteOne({_id : checkbox},function(err){
      if(err){
        console.log("Delete error");
      }else{
        console.log(checkbox + " deleted");
      }
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name : listName},{$pull : {items : {_id : checkbox}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }

})


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
