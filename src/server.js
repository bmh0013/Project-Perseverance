const express = require('express');
const app = express();
const csv = require("csv-parser");
const fs = require('fs');
const mongoose = require('mongoose');
const { Product, Styles, RelatedProducts } = require('./models');

const uri = "mongodb://localhost:27017/SDC";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => {
    Styles.create({product_id: 1});
    app.listen(3000, () => {
      console.log('Connected to mongo, listening on 3000...');
    })
  })
  .catch(err => {console.log(err)});


// app.get('/', async (req, res) => {
//   const record = await Product.find({id: 1});
//   res.send(record);
// })

// document.save(err => {
//   if (err) {console.log(err)}
// });