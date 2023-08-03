//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

dotenv.config();

const app = express();



app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pz3jh5v.mongodb.net/todolistDB`;

mongoose.connect(mongoURL, { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema); 

const item1 = new Item({
  name: "Welcome to todoList",
});

const item2 = new Item({
  name: "Add new things",
});

const item3 = new Item({
  name: "You can delete extra things",
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listsSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved into our DB.");
          })
          .catch(function (err) {
            console.log(err);
          });

        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item
      .save()
      .then(function () {
        res.redirect("/");
      })
      .catch(function (err) {
        console.log("Error occurred:", err);
      });
  } else {
    List.findOne({ name: listName })
      .then(function (foundDynamic) {
        foundDynamic.items.push(item);
        return foundDynamic.save();
      })
      .then(function () {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log("Error occurred:", err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("Item removed successfully.");
      })
      .catch(function (err) {
        console.log("err");
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function () {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log("Error occurred:", err);
      });
  }
});

app.get("/:dynamicLists", function (req, res) {
  const dynamicLists = _.capitalize(req.params.dynamicLists);

  List.findOne({ name: dynamicLists })
    .then(function (foundDynamic) {
      if (!foundDynamic) {
        const list = new List({
          name: dynamicLists,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + dynamicLists);
      } else {
        res.render("list", {
          listTitle: foundDynamic.name,
          newListItems: foundDynamic.items,
        });
      }
    })
    .catch(function (err) {
      console.log("Error occurred:", err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server is started on PORT ${PORT}`));

// app.listen(3000, function () {
//   console.log("Server started on port 3000")
// });
