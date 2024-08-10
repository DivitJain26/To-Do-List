//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Admin:Admin123@cluster0.aftow.mongodb.net/toDoListDB');

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema) 

const item1 = new Item ({
  name: "Welcome to your todo list!"
})

const item2 = new Item ({
  name: "Hide the + button  to add a new item"
})

const item3 = new Item ({
  name: "<-- Hit this to delete as item"
})

const defaultItems = [item1, item2, item3]

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

const day = date.getDate();

app.get("/", (req, res) => {
  
  findItems()
  async function findItems() {
    try {

      const foundItems = await Item.find()

      if (foundItems.length === 0) {
        insertItems(Item, defaultItems)
        res.redirect("/")
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }

    } catch (error) {
      console.log(error.message)
    }
  }

});

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list 

  const item = new Item({
    name: itemName
  }) 

  if (listName === day) {

    insertItems(Item, item)
    res.redirect("/")

  } else {
    checkList()
    async function checkList() {
      try {
        const foundList = await List.findOne({name: listName})
        foundList.items.push(item)
        await foundList.save()
        res.redirect("/" + listName)
      } catch (error) {
        console.log(error.message)
      }
    }
  }
});


app.get("/:customListName", (req, res) => {

  const customListName = _.capitalize(req.params.customListName)
  
  const list = new List ({
    name: customListName,
    items: defaultItems
  })

  CheckItem()
  async function CheckItem() {
    try {
      const foundList = await List.findOne({name: customListName}).exec()
      if(foundList) {
        console.log("Match found")
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items})
      } else {
        insertItems(List, list)
        res.redirect("/" + customListName)
      }
    } catch (error) {

    }
  }
})

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  console.log(checkedItemId)
  console.log(listName)
  
  deleteById()
  async function deleteById() {
    try {
      if (listName === day) {

        await Item.findByIdAndDelete(checkedItemId)
        res.redirect("/")

      } else {
        const foundList = await List.updateOne( { name: listName }, { $pull: { items: { _id: checkedItemId } } }, { "new": true } )
        if (foundList) {
          res.redirect("/" + listName)
        } 
      }

      } catch (error) {
        console.log(error.message)
      }
    }
})

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});



////////////////////////////////////////// FUNCTIONS ///////////////////////////////////

async function insertItems(coll ,doc) {
  try {
    await coll.insertMany(doc)
    console.log("Successfully added")
    
  } catch (error) {
    console.log(error.message)
  }
}
