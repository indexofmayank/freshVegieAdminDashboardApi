require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

const paymentRouter = require('./routes/paymentRouter');
const productRouter = require('./routes/productRouter');
const adminRouter = require('./routes/adminRouter');
const orderRouter = require('./routes/orderRouter');
const uploadRouter = require('./routes/uploadRouter');
const userRouter = require('./routes/userRouter');
const categoryRouter = require('./routes/categoryRouter');
const bannerRouter = require('./routes/bannerRouter');
const polygonRouter = require('./routes/polygonRouter');
const inventoryRouter = require('./routes/inventoryRouter');
const notificationRouter = require('./routes/notificationRotuer');
const deliveryPartnerRouter = require('./routes/deliveryRouter');
const csvRouter = require('./routes/csvRouter');
const orderStatusRouter = require('./routes/orderStatsRouter');
const orderTableRouter = require('./routes/orderTableRouter');
const dealOfTheDayRouter = require('./routes/dealofthedayRouter');
const dashboardRouter = require('./routes/dashboardRouter');
const referralRouter = require('./routes/referralRouter');
const deliveryInstructions = require('./routes/deliveryInstructionsRouter');
const walletRouter = require('./routes/walletRouter');
const demoProductRouter = require('./routes/demoProductRouter');
const assetRouter = require('./routes/assetRouter');
const subcategory = require('./routes/subcategoryRouter');

const errorMiddleware = require('./middleware/Error');

const connectToDb = require('./config/db');

const cloudinary = require('./config/cloudinary');

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Server shutting down due to uncaught exception`);
  process.exit(1);
});

connectToDb();

app.use(
  cors({
    origin: [/vercel\.app$/,/fresh-vegis\.in$/, /localhost:\d{4}$/],
    credentials: true,
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());
app.use(express.static('public'));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// Define a route to serve an EJS page 


// app.get('/', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'API service running 🚀',
//   });
// });

app.use('/api/payment', paymentRouter);
app.use('/api/products', productRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/user', userRouter);
app.use('/api/category', categoryRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/polygon', polygonRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/notification', notificationRouter);
app.use('/api/deliveryPartner', deliveryPartnerRouter);
app.use('/api/csv', csvRouter);
app.use('/api/orderstatus', orderStatusRouter);
app.use('/api/ordertable', orderTableRouter);
app.use('/api/dealoftheday', dealOfTheDayRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/referral', referralRouter);
app.use('/api/deliveryInstructions', deliveryInstructions);
app.use('/api/wallet', walletRouter);
app.use('/api/demo/', demoProductRouter);
app.use('/api/asset/', assetRouter);
app.use('/api/subcategory',subcategory);

app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.render('index', {
      title: 'Fresh-Vegi - An Online Grocery Store',
      companyInfo: {
          name: 'Fresh-Vegi',
          subtitle: 'An Online Grocery Store',
          subsidiary: 'A Subsidiary of SPT Sanchay Enterprises',
          customerCare: '7050815081',
          website: 'www.Fresh-Vegi.com'
      }
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
      title: 'About Us - Fresh-Vegi'
  });
});

// Terms & Conditions page
app.get('/terms', (req, res) => {
  res.render('terms', {
      title: 'Terms & Conditions - Fresh-Vegi'
  });
});

// Privacy Policy page
app.get('/privacy', (req, res) => {
  res.render('privacy', {
      title: 'Privacy Policy - Fresh-Vegi'
  });
});

// Contact Us page
app.get('/contact', (req, res) => {
  res.render('contact', {
      title: 'Contact Us - Fresh-Vegi',
      customerCare: '7050815081'
  });
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Server running');
});

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Server shutting down due to unhandled promise rejection`);
  server.close(() => {
    process.exit(1);
  });
});
