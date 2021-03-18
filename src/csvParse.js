const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const { Product, RelatedProducts } = require('./models');


const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parseFeatures() {
  await client.connect();
  const database = client.db("SDC");
  const testCollection = database.collection("product_features");
  var stream = fs.createReadStream('./data/features.csv').pipe(csv());

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
      await testCollection.insertOne(entry);
      entry = {};
      entry.product_id = product_id
      entry.features = value !== 'null' ? [ { feature, value } ] : [];
    }
  }
  await testCollection.insertOne(entry);
  console.log('Finished!')
}

parseFeatures();
