const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const { Styles, Product, RelatedProducts } = require("./models.js");
const mongoose = require('mongoose');


const uri = "mongodb://localhost:27017/SDC";

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true });
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });


async function parseFeatures() {
  await client.connect();
  const database = client.db("SDC");
  const productFeaturesColl = database.collection("product_features");
  const stream = fs.createReadStream('./data/features.csv').pipe(csv());

  productFeaturesColl.drop();
  let entry = {product_id: 1, features: []};

  console.log('Loading entries into database...')
  // Loop through each row in CSV
  for await (const chunk of stream) {
    const product_id = Number(chunk['1']);
    const feature = chunk['Fabric'];
    const value = chunk['Canvas'];

    // Checks to see if the next row is the same product_id or a new one
    if (product_id === entry.product_id) {
      if (value !== 'null') {
        entry.features.push( { feature, value } )
      }
    } else {
      await productFeaturesColl.insertOne(entry);
      entry = {};
      entry.product_id = product_id
      entry.features = value !== 'null' ? [ { feature, value } ] : [];
    }
  }
  await productFeaturesColl.insertOne(entry);
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
  const stream = fs.createReadStream('./data/styles.csv').pipe(csv());
  const stream2 = fs.createReadStream('./data/photos.csv').pipe(csv());

  let entry = {};
  let Document;
  let count = 1;
  console.log('Loading styles into database...')
  for await (const chunk of stream) {
    entry.product_id = Number(chunk['productId']);
    entry.style_id = chunk['id'];
    entry['default?'] = chunk['default_style'] === '1' ? true : false;
    entry.sale_price = chunk.sale_price === 'null' ? '0' : chunk.sale_price;
    entry.original_price = chunk.original_price;
    entry.name = chunk.name

    Document = new Styles(entry);
    Document.save()
    .then(data => {
      console.log(count++)
    })
    .catch(err => {
      console.log(err);
    });
    entry = {};
  }
  console.log('Styles have been loaded!')

  console.log('Updating style documents with photos...')
  for await (const chunk of stream2) {
    let photoObj = {}
    photoObj.url = chunk[' url'];
    photoObj.thumbnail_url = chunk[' thumbnail_url'];

    if (chunk['url'] || chunk['thumbnail_url'] || chunk['styleId']) {
      console.log(chunk);
    }

    await Styles.findOneAndUpdate({style_id: chunk[' styleId']}, {photos: photoObj}, (err, doc) => {
      if (err) return handleError(err);
      console.log(doc)
    })
  }
  console.log('Finished!')
}

// parseFeatures();
// parseRelatedProducts();
parseStyles();
