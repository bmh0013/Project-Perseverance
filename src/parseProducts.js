const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parseProducts() {
  await client.connect();
  let entry, operations;
  const database = client.db("SDC");
  const productInfoColl = database.collection("product_info");
  const stream = fs.createReadStream(path.join(__dirname, '/../data/product.csv')).pipe(csv());

  productInfoColl.createIndex( { id: 1 } );

  operations = [];

  console.log('Loading Products to database...')
  for await (const chunk of stream) {
    entry = {
      insertOne: {
        document: {
          id: Number(chunk['id']),
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
  console.log('Finished loading products!')
  await client.close();
}

parseProducts();