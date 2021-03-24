const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


async function parseRelatedProducts() {
  let entry, operations, allRelated, currentProduct, product_id, related;
  await client.connect();
  const database = client.db("SDC");
  const relatedProductsColl = database.collection("related_products");
  const stream = fs.createReadStream(path.join(__dirname, '/../data/related.csv')).pipe(csv());

  relatedProductsColl.createIndex( { product_id: 1 } );

  operations = [];
  allRelated = [];
  currentProduct = 1;

  console.log('Loading related products into database...')
  for await (const chunk of stream) {
    product_id = Number(chunk['current_product_id']);
    related = Number(chunk['related_product_id']);

    if (currentProduct === product_id) {
      allRelated.push( related );
    } else {
      createEntry()
      currentProduct = product_id
      allRelated = [ related ];

      if (operations.length > 500) {
        await relatedProductsColl.bulkWrite(operations)
        operations = [];
      }
    }
  }

  if (allRelated.length) {
    createEntry();
    await relatedProductsColl.bulkWrite(operations)
  }

  function createEntry() {
    entry = {
      insertOne: {
        document: {
          product_id: currentProduct,
          related_products: allRelated.slice()
        }
      }
    };
    operations.push(entry);
  }

  console.log('Finished loading related products!')
  await client.close();
}

parseRelatedProducts();
