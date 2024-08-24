const mongoose = require('mongoose');
const Product = require('./path-to-your-product-model'); // Adjust the path as necessary

const seedProducts = [
  // Vegetables
  {
    name: 'Carrot',
    product_status: true,
    category: '66b1f723f36c7eed87dab6ab', // Vegetables
    add_ons: 'Organic',
    search_tags: 'carrot, vegetable, healthy',
    selling_method: 'Retail',
    description: 'Fresh organic carrots',
    price: 1.99,
    offer_price: 1.50,
    purchase_price: 1.00,
    images: [
      { public_id: 'carrot1', secure_url: 'http://example.com/carrot1.jpg' }
    ],
    sku: 'CAR123',
    barcode: '123456789012',
    stock: 100,
    stock_notify: 10,
    tax: 0.10,
    product_detail_min: 1,
    product_detail_max: 5,
    featured: true
  },
  {
    name: 'Broccoli',
    product_status: true,
    category: '66b1f723f36c7eed87dab6ab', // Vegetables
    add_ons: 'Fresh',
    search_tags: 'broccoli, vegetable, green',
    selling_method: 'Retail',
    description: 'Fresh green broccoli',
    price: 2.99,
    offer_price: 2.50,
    purchase_price: 2.00,
    images: [
      { public_id: 'broccoli1', secure_url: 'http://example.com/broccoli1.jpg' }
    ],
    sku: 'BRO456',
    barcode: '234567890123',
    stock: 80,
    stock_notify: 15,
    tax: 0.15,
    product_detail_min: 1,
    product_detail_max: 5,
    featured: false
  },

  // Drugs
  {
    name: 'Aspirin',
    product_status: true,
    category: '66b207f9a4fa55b2ae507b73', // Drugs
    add_ons: 'Pain relief',
    search_tags: 'aspirin, drug, pain',
    selling_method: 'Retail',
    description: 'Pain relief medication',
    price: 4.99,
    offer_price: 3.99,
    purchase_price: 3.50,
    images: [
      { public_id: 'aspirin1', secure_url: 'http://example.com/aspirin1.jpg' }
    ],
    sku: 'ASP789',
    barcode: '345678901234',
    stock: 200,
    stock_notify: 20,
    tax: 0.20,
    product_detail_min: 1,
    product_detail_max: 10,
    featured: true
  },
  {
    name: 'Cough Syrup',
    product_status: true,
    category: '66b207f9a4fa55b2ae507b73', // Drugs
    add_ons: 'Relieves cough',
    search_tags: 'cough syrup, drug, cough',
    selling_method: 'Retail',
    description: 'Syrup for relieving cough',
    price: 5.99,
    offer_price: 4.50,
    purchase_price: 4.00,
    images: [
      { public_id: 'cough_syrup1', secure_url: 'http://example.com/cough_syrup1.jpg' }
    ],
    sku: 'COU012',
    barcode: '456789012345',
    stock: 150,
    stock_notify: 25,
    tax: 0.25,
    product_detail_min: 1,
    product_detail_max: 5,
    featured: false
  },

  // Chemist
  {
    name: 'Vitamin C Tablets',
    product_status: true,
    category: '66b20821a4fa55b2ae507b9a', // Chemist
    add_ons: 'Boosts immunity',
    search_tags: 'vitamin C, tablets, chemist',
    selling_method: 'Retail',
    description: 'Vitamin C tablets for immunity',
    price: 10.99,
    offer_price: 9.99,
    purchase_price: 8.50,
    images: [
      { public_id: 'vitamin_c1', secure_url: 'http://example.com/vitamin_c1.jpg' }
    ],
    sku: 'VIT234',
    barcode: '567890123456',
    stock: 100,
    stock_notify: 15,
    tax: 0.15,
    product_detail_min: 1,
    product_detail_max: 10,
    featured: true
  },
  {
    name: 'Pain Relief Cream',
    product_status: true,
    category: '66b20821a4fa55b2ae507b9a', // Chemist
    add_ons: 'External use',
    search_tags: 'pain relief, cream, chemist',
    selling_method: 'Retail',
    description: 'Cream for pain relief',
    price: 6.99,
    offer_price: 5.50,
    purchase_price: 5.00,
    images: [
      { public_id: 'pain_relief_cream1', secure_url: 'http://example.com/pain_relief_cream1.jpg' }
    ],
    sku: 'PAI456',
    barcode: '678901234567',
    stock: 120,
    stock_notify: 20,
    tax: 0.20,
    product_detail_min: 1,
    product_detail_max: 5,
    featured: false
  },

  // Fruits
  {
    name: 'Apple',
    product_status: true,
    category: '66c6eba94a95273f097d2e3a', // Fruits
    add_ons: 'Organic',
    search_tags: 'apple, fruit, fresh',
    selling_method: 'Retail',
    description: 'Fresh organic apples',
    price: 3.99,
    offer_price: 3.50,
    purchase_price: 3.00,
    images: [
      { public_id: 'apple1', secure_url: 'http://example.com/apple1.jpg' }
    ],
    sku: 'APP567',
    barcode: '789012345678',
    stock: 150,
    stock_notify: 20,
    tax: 0.10,
    product_detail_min: 1,
    product_detail_max: 10,
    featured: true
  },
  
];

// Connect to MongoDB and seed the database
mongoose.connect('mongodb+srv://admin:f0Z552lDuB8bsl34@cluster0.omelufv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/f0Z552lDuB8bsl34', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    return Product.insertMany(seedProducts);
  })
  .then(() => {
    console.log('Seed data inserted');
    mongoose.disconnect();
  })
  .catch((error) => {
    console.error('Error inserting seed data:', error);
    mongoose.disconnect();
  });

  module.exports = seed;
