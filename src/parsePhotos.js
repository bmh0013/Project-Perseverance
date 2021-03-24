const { MongoClient } = require("mongodb");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017/SDC";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function parsePhotos() {
  let entry, operations;
  await client.connect();
  const database = client.db("SDC");
  const productStylesColl = database.collection("product_styles");
  const stream = fs.createReadStream(path.join(__dirname, '/../data/photos.csv')).pipe(csv());

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
  console.log('Finished updating styles with photos!')
  await client.close();
}

parsePhotos()
