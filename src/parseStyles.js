const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


async function parseStyles() {
  let entry, operations;
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream(path.join(__dirname, '/../data/styles.csv')).pipe(csv());

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
  client.close();
}

parseStyles();
