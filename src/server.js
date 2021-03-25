const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const csv = require("csv-parser");
const fs = require('fs');
const path = require('path');
const { MongoClient } = require("mongodb");
const { TOKEN } = require('../token.js')

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect()
  .then(res => {
    app.listen(3000, () => {
      console.log('Connected to mongo, listening on 3000...')
    })
  })
  .catch(err => {
    console.log(err);
  });

const database = client.db("SDC");
const productInfo = database.collection("product_info");
const productFeatures = database.collection("product_features");
const productStyles = database.collection("product_styles");
const relatedProducts = database.collection("related_products");


app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );

app.get('/loaderio-95479c543e59383ec77b16314095632e', (req, res) => {
  res.send(TOKEN);
})

app.get('/products', async (req, res) => {
  let count = Number(req.query.count) || 5;
  var products = await productInfo.find( { id: { $gte: 1, $lte: count } } ).toArray();
  res.send(products);
})

app.get('/products/:product_id', async (req, res) => {
  let product = await productInfo.findOne( { id: Number(req.params.product_id) } );
  let features = await productFeatures.findOne( { product_id: Number(req.params.product_id) } ) || [];
  Promise.all([product, features])
    .then(result => {
      result[0].features = result[1].features;
      res.send(result[0]);
    })
})

app.get('/products/:product_id/styles', async (req, res) => {
  let styles = {
    product_id: Number(req.params.product_id),
    results: await productStyles.find( { product_id: Number(req.params.product_id) } ).toArray()
  };
  res.send(styles);
})

app.get('/products/:product_id/related', async (req, res) => {
  var related = await relatedProducts.findOne( { product_id: Number(req.params.product_id) } );
  res.send(related.related_products);
})
