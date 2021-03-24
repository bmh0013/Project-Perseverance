const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parseSKU() {
  let entry, operations, style_id, size, quantity;
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream(path.join(__dirname, '/../data/skus.csv')).pipe(csv());

  operations = [];

  console.log('Updating styles with skus...')
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

  console.log('Finished updating styles with skus!')
  await client.close();
}

parseSKU()
