// load env-vars
require('dotenv').config();

// requiring dependencies
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// initialize express
const app = express();

// requiring routers
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

// requiring middlewares
const errorMiddleware = require('./middleware/Error');

// require db configs
const connectToDb = require('./config/db');

// require cloudinary configs
const cloudinary = require('./config/cloudinary');

// uncaught exception
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Server shutting down due to uncaught exception`);
  process.exit(1);
});

// connect to db
connectToDb();

// using middlewares
app.use(
  cors({
    origin: [/vercel\.app$/, /localhost:\d{4}$/],
    credentials: true,
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());

// basic api route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API service running 🚀',
  });
});

// using routers
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

// using other middlewares
app.use(errorMiddleware);

// starting server
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Server running');
});

// unhandled promise rejection
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Server shutting down due to unhandled promise rejection`);
  server.close(() => {
    process.exit(1);
  });
});
