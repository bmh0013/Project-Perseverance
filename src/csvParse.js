const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const { Styles, Product, RelatedProducts } = require("./models.js");
const mongoose = require('mongoose');

const uri = "mongodb://localhost:27017/SDC";

// mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true });
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parseProducts() {
  let entry;
  await client.connect();
  const database = client.db("SDC");
  const productInfoColl = database.collection("product_info");
  const stream = fs.createReadStream('./data/product.csv').pipe(csv());

  productInfoColl.drop();

  let operations = [];
  let count = 0;

  for await (const chunk of stream) {
    entry = {
      insertOne: {
        document: {
          product_id: Number(chunk['id']),
          name: chunk[' name'],
          slogan: chunk[' slogan'],
          description: chunk[' description'],
          category: chunk[' category'],
          default_price: chunk[' default_price'],
        }
      }
    };

    operations.push(entry);
    count++;
    if (count % 500 === 0) {
      productInfoColl.bulkWrite(operations)
      .catch(err => {console.log(err);})
      operations = [];
    }
  }
  productInfoColl.bulkWrite(operations, {ordered : true})
  .catch(err => {console.log(err);})
  console.log('Finished loading products')
}

async function parseFeatures() {
  let entry, currentID;
  await client.connect();
  const database = client.db("SDC");
  const productFeaturesColl = database.collection("product_features");
  const stream = fs.createReadStream('./data/features.csv').pipe(csv());

  currentID = 1;
   = [];

  for await (const chunk of stream) {
    const product_id = Number(chunk['1']);
    const feature = chunk['Fabric'];
    const value = chunk['Canvas'];

    if (product_id === currentID) {
      if (value !== 'null') {
        entry.push( { feature, value } )

      }
    } else {
      await productFeaturesColl.updateOne(
        { product_id: currentID },
        { $set: { features: entry } },
        (err, doc) => {
          if (err) {console.log(err);}
          // console.log(doc);
        }
      )
      currentID = product_id;
      entry = [];
      if (value !== 'null') {
        entry.push( { feature, value } )
      }
    }
  }
  if (entry.length) {
    await productFeaturesColl.updateOne(
      { product_id: currentID },
      { $set: { features: entry } },
      (err, doc) => {
        if (err) {console.log(err);}
      }
    )
  }
  console.log('Finished!')
}

async function parseRelatedProducts() {
  await client.connect();
  const database = client.db("SDC");
  const relatedProductsColl = database.collection("related_products");
  const stream = fs.createReadStream('./data/related.csv').pipe(csv());

  relatedProductsColl.drop();
  let entry = {product_id: 1, related_products: []};
  console.log('Loading entries into database...')
  // Loop through each row in CSV
  for await (const chunk of stream) {
    const product_id = Number(chunk['current_product_id']);
    const related_product_id = Number(chunk['related_product_id']);

    // Checks to see if the next row is the same product_id or a new one
    if (product_id === entry.product_id) {
      if (!entry.related_products.includes( related_product_id )) {
        entry.related_products.push( related_product_id )
      }
    } else {
      await relatedProductsColl.insertOne(entry);
      entry = {};
      entry.product_id = product_id
      entry.related_products = [ related_product_id ];
    }
  }
  await relatedProductsColl.insertOne(entry);
  console.log('Finished!')
}

async function parseStyles() {
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream('./data/styles.csv').pipe(csv());

  productStylesColl.drop();

  for await (const chunk of stream) {
    console.log(chunk);
    let entry = {
    'product_id': Number(chunk['productId']),
    'style_id': Number(chunk['id']),
    'default?': chunk['default_style'] === '1' ? true : false,
    'sale_price': chunk['sale_price'] === 'null' ? '0' : chunk['sale_price'],
    'original_price': chunk['original_price'],
    'name': chunk['name']
    };

    await productStylesColl.insertOne(entry);
  }
  console.log('Finished!')

  const stream2 = fs.createReadStream('./data/photos.csv').pipe(csv());

  let entries = [];
  let currentStyle = 1;

  for await (const chunk of stream2) {
    let style_id = Number(chunk[' styleId']);

    let photoObj = {
      url: chunk[' url'],
      thumbnail_url: chunk[' thumbnail_url']
    }

    if (style_id === currentStyle) {
      entries.push( photoObj )
    } else {
      await productStylesColl.findOneAndUpdate(
        { style_id: currentStyle },
        { $set: { photos: entries } },
        (err, doc) => {
          if (err) {console.log(err);}
          console.log(storage);
        }
      )
      entries = [ photoObj ]
      currentStyle = style_id;
    }
  }
}

parseProducts();
// parseFeatures();
// parseRelatedProducts();
// parseStyles();
