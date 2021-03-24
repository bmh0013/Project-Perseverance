const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parseFeatures() {
  let entry, operations, allFeatures, currentProduct, product_id, feature, value;
  await client.connect();
  const database = client.db("SDC");
  const productFeaturesColl = database.collection("product_features");
  const stream = fs.createReadStream(path.join(__dirname, '/../data/features.csv')).pipe(csv());

  productFeaturesColl.createIndex( { product_id: 1 } );

  operations = [];
  allFeatures = [];
  currentProduct = 1;

  console.log('Loading features into database...')
  for await (const chunk of stream) {
    product_id = Number(chunk['product_id']);
    feature = chunk['feature'];
    value = chunk['value'];

    if (value === 'null') {
      continue;
    }
    if (currentProduct === product_id) {
      allFeatures.push( {feature, value} );
    } else {
      createEntry()
      currentProduct = product_id
      allFeatures = [ {feature, value} ];

      if (operations.length > 500) {
        await productFeaturesColl.bulkWrite(operations)
        operations = [];
      }
    }
  }

  if (allFeatures.length) {
    createEntry();
    await productFeaturesColl.bulkWrite(operations)
  }

  function createEntry() {
    entry = {
      insertOne: {
        document: {
          product_id: currentProduct,
          features: allFeatures.slice()
        }
      }
    };
    operations.push(entry);
  }

  console.log('Finished loading features!')
  client.close();
}

parseFeatures()
