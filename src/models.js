const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  category: String,
  slogan: String,
  description: String,
  default_price: String,
  features: Array
}, {collection: 'product_info'});

const stylesSchema = new mongoose.Schema({
  product_id: Number,
  style_id: Number,
  'default?': Boolean,
  sale_price: String,
  original_price: String,
  photos: Array,
  skus: Array
}, {collection: 'product_styles'});

const relatedProductsSchema = new mongoose.Schema({
  product_id: Number,
  related_products: Array
}, {collection: 'related_products'});

const Product = mongoose.model('product_info', productSchema);
const Styles = mongoose.model('product_styles', stylesSchema);
const RelatedProducts = mongoose.model('related_products', relatedProductsSchema);

module.exports = {
  Product,
  Styles,
  RelatedProducts
};
