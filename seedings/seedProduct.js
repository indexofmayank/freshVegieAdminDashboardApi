const mongoose = require('mongoose');
const product = require('../models/productModel');

const products = require('../utils/ProductDummy');

mongoose
  .connect(mongodb+srv://admin:f0Z552lDuB8bsl34@cluster0.omelufv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/f0Z552lDuB8bsl34, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connected!');
    return Product.insertMany(products);
  })
  .then(() => {
    console.log('Data seeded successfully!');
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('Error connecting to the database or seeding data:', error);
    mongoose.connection.close();
  });