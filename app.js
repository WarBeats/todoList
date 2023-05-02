//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://nudebeatstyle:43bbeYZnj1t1NobY@firstmongodb.hkti3fn.mongodb.net/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useUnifiedTopology: true });
}

const itemSchema = new mongoose.Schema ({
  name: {
    type: String,
    require: true
  },
}, {versionKey: false});

const Item = mongoose.model('Item', itemSchema);


const item1 = new Item({
  name: "Welcome to your To do List!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model('List', listSchema);


app.get("/", (req, res) =>{

  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log('Data inserted successfully');
            res.redirect('/');
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        res.render('list', {listTitle: 'Today', newListItems: foundItems});
      }
    })
    .catch((error) => {
      console.log(error);
    })

});

app.post('/', (req, res) => {
  let itemName = req.body.newItem;
  const listName = req.body.list;
 
  //capitalize the first letter
 // itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  itemName = _.startCase(_.toLower(itemName));
  //check if the item isn't an empty string
  
  if (itemName.trim() !== '') {
    const item = new Item({
      name: itemName
    });

    if (listName === 'Today') {
      item.save();
      res.redirect('/');
    } else {
      
      List.findOne({name: listName})
      .then((foundItems) => {
        foundItems.items.push(item); // ==> found items
        foundItems.save();
        res.redirect('/' + listName);
      })
      .catch((err) => {
        console.log(err);
      });
    }
  } 
})

app.post('/delete', (req, res) => {

  const listName = req.body.listName;
  const checkItemId = req.body.checkbox;

  if (listName === 'Today') {
    
    deleteCheckedItem();

  } else {
    
    deleteCustomItem();

  }
  async function deleteCheckedItem() {
    await Item.deleteOne({_id: checkItemId});
    res.redirect('/');
  }

  async function deleteCustomItem() {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: {items: { _id: checkItemId } } } 
    );
    res.redirect('/' + listName);
  }
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne( { name: customListName})
  
  .then((foundList) => {
    
    if (!foundList) {  
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();
      console.log('saved');
      res.redirect('/' + customListName);
    
    } else {
      //show an existing list
      res.render('list', {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }
  })
  .catch((err) => {
    console.log(err);
  });
})



app.get('/about', (req, res) =>{
  res.render('about');
});

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
