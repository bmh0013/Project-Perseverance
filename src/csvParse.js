const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const { Styles, Product, RelatedProducts } = require("./models.js");
const mongoose = require('mongoose');

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parseProducts() {
  let entry, operations;
  await client.connect();
  const database = client.db("SDC");
  const productInfoColl = database.collection("product_info");
  const stream = fs.createReadStream('./data/product.csv').pipe(csv());

  productInfoColl.drop();
  productInfoColl.createIndex( { product_id: 1 } );

  operations = [];

  console.log('Loading to database...')
  for await (const chunk of stream) {
    entry = {
      insertOne: {
        document: {
          product_id: Number(chunk['id']),
          name: chunk['name'],
          slogan: chunk['slogan'],
          description: chunk['description'],
          category: chunk['category'],
          default_price: chunk['default_price'].trim(),
        }
      }
    };

    operations.push(entry);
    if (operations.length > 500) {
      productInfoColl.bulkWrite(operations)
      .catch(err => {console.log(err);})
      operations = [];
    }
  }
  if (operations.length) {
    productInfoColl.bulkWrite(operations)
    .catch(err => {console.log(err);})
  }
  console.log('Finished loading products')
}

async function parseFeatures() {
  let entry, operations, product_id, feature, value;
  await client.connect();
  const database = client.db("SDC");
  const productInfoColl = database.collection("product_info");
  const stream = fs.createReadStream('./data/features.csv').pipe(csv());

  operations = [];

  console.log('Updating entries with features...')
  for await (const chunk of stream) {
    product_id = Number(chunk['product_id']);
    feature = chunk['feature'];
    value = chunk['value'];

    if (value === 'null') {
      continue;
    }

    entry = {
      updateOne: {
        filter: { product_id: product_id },
        update: { $push: { features:  { feature, value } } }
      }
    };
    operations.push(entry);

    if (operations.length > 500) {
      await productInfoColl.bulkWrite(operations)
      operations = [];
    }
  }
  if (operations.length) {
    productInfoColl.bulkWrite(operations)
    .catch(err => {console.log(err);})
    operations = [];
  }

  console.log('Finished!')
}

async function parseRelatedProducts() {
  let entry, operations;
  await client.connect();
  const database = client.db("SDC");
  const relatedProductsColl = database.collection("related_products");
  const stream = fs.createReadStream('./data/related.csv').pipe(csv());

  relatedProductsColl.drop();
  entry = {product_id: 1, related_products: []};

  console.log('Loading entries into database...')
  for await (const chunk of stream) {
    const product_id = Number(chunk['current_product_id']);
    const related_product_id = Number(chunk['related_product_id']);

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
  let entry, operations;
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream('./data/styles.csv').pipe(csv());

  productStylesColl.drop();
  productStylesColl.createIndex( { product_id: 1 } );
  productStylesColl.createIndex( { style_id: 1 } );

  operations = [];

  console.log('Loading styles into database...');
  for await (const chunk of stream) {
    entry = {
      insertOne: {
        document: {
          'product_id': Number(chunk['productId']),
          'style_id': Number(chunk['id']),
          'default?': chunk['default_style'] === '1' ? true : false,
          'sale_price': chunk['sale_price'] === 'null' ? '0' : chunk['sale_price'],
          'original_price': chunk['original_price'],
          'name': chunk['name']
        }
      }
    };

    operations.push(entry);
    if (operations.length > 500) {
      productStylesColl.bulkWrite(operations)
      .catch(err => {console.log(err);})
      operations = [];
    }
  }
  if (operations.length) {
    productStylesColl.bulkWrite(operations)
    .catch(err => {console.log(err);})
    operations = [];
  }
  console.log('Finished loading styles')
}

async function parsePhotos() {
  let entry, operations;
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream('./data/photos.csv').pipe(csv());

  operations = [];

  console.log('Updating styles with photos...');
  for await (const chunk of stream) {
    entry = {
      updateOne: {
        filter: { style_id: Number(chunk[' styleId']) },
        update: { $push: { photos: { url: chunk[' url'], thumbnail_url: chunk[' thumbnail_url'] } } }
      }
    };
    operations.push(entry);

    if (operations.length > 500) {
      await productStylesColl.bulkWrite(operations)
      operations = [];
    }
  }

  if (operations.length) {
    productStylesColl.bulkWrite(operations)
    .catch(err => {console.log(err);})
    operations = [];
  }
  console.log('Finished!')
}

async function parseSKU() {
  let entry, operations, style_id, size, quantity;
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream('./data/skus.csv').pipe(csv());

  operations = [];

  console.log('Updating entries with skus...')
  for await (const chunk of stream) {
    id = chunk['id'];
    style_id = Number(chunk[' styleId']);
    size = chunk[' size'];
    quantity = chunk[' quantity'];

    entry = {
      updateOne: {
        filter: { style_id: style_id },
        update: { $push: { skus:  {[id]: { size, quantity } } } }
      }
    };
    operations.push(entry);

    if (operations.length > 500) {
      await productStylesColl.bulkWrite(operations)
      operations = [];
    }
  }
  if (operations.length) {
    productStylesColl.bulkWrite(operations)
    .catch(err => {console.log(err);})
    operations = [];
  }

  console.log('Finished!')
}


// parseProducts();
// parseFeatures();
// parseRelatedProducts();
// parseStyles();
// parsePhotos();
parseSKU();