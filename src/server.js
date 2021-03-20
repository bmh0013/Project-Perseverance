const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const csv = require("csv-parser");
const fs = require('fs');
const mongoose = require('mongoose');
const { Product, Styles, RelatedProducts} = require('./models.js');

const uri = "mongodb://localhost:27017/SDC";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => {
    app.listen(3000, () => {
      console.log('Connected to mongo, listening on 3000...');
    })
  })
  .catch(err => {console.log(err)});

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );


app.get('/products', async (req, res) => {
  let count = req.body.count || 5;
  const records = await Product.find( { id: { $in: [1, count] } } );
  res.send(records);
})

app.get('/products', async (req, res) => {
  let count = req.body.count || 5;
  const records = await Product.find( { id: { $in: [1, count] } } );
  res.send(records);
})
