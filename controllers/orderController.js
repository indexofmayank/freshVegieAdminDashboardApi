
require('dotenv').config();
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Demoproduct = require('../models/demoProductModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const orderLogger = require('../loggers/orderLogger');
const axios = require('axios');
const mongoose = require('mongoose');
const { format } = require('winston');
const nodemailer = require('nodemailer');
const { useWalletfunds } = require('../controllers/walletController');
const Wallet = require('../models/walletModel');
const User = require('../models/userModel');


const GOOGLE_MAPS_API_KEY = 'AIzaSyChe49SyZJZYPXiyZEey4mvgqxO1lagIqQ';

const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder || !lastOrder.orderId) {
    return 'ORD1';
  }
  const lastOrderId = parseInt(lastOrder.orderId.replace('ORD', ''), 10);
  return `ORD${lastOrderId + 1}`;
};

const getLatLng = async (toCheckAddress) => {
  const { address, city, pin_code, state, landmark, locality } = toCheckAddress;
  if (!address || !city || !pin_code || !state) {
    return res.status(400).json({ success: false, message: 'Incomplete address information' });
  }
  const constructedAddress = `${address}, ${locality || ''}, ${city}, ${state}, ${pin_code}`;
  console.log(constructedAddress);

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: constructedAddress,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    console.log(response);
    const results = response.data.results;
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Extract latitude and longitude from the response
    const location = results[0].geometry.location;
    const { lat, lng } = location;

    res.json({
      success: true,
      latitude: lat,
      longitude: lng
    });
  } catch (error) {
    console.log('Error occured while get lat lng', error);
    throw new ErrorHandler('Unable to get lat lng');
  }
};

// exports.createNewOrder = catchAsyncError(async (req, res, next) => {
//   console.log(req.body);
//   const {
//     shippingInfo,
//     orderItems,
//     user,
//     paymentInfo,
//     paidAt,
//     itemsPrice,
//     discountPrice,
//     shippingPrice,
//     totalPrice,
//     orderStatus,
//     deliverAt,
//     orderedFrom,
//     deliveryInfo,
//   } = req.body;

//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     //=-=-=-=-=-=-=-=-=-=-=-= Payment handling starts =-=-=-=-=-=-=-=-=-=-=-=-
//     if (paymentInfo && user.userId) {
//       switch (paymentInfo.payment_type) {
//         case 'cod':
//           if (paymentInfo.useReferral) {
//             const userForReferal = await User.findById(user.userId).session(session);
//             const description = 'Product purchased';
//             const amount = paymentInfo.referralAmount;

//             if (!userForReferal) {
//               return res.status(400).json({ success: false, message: 'Referal not found' });
//             }

//             if (userForReferal.userReferrInfo.referralAmount < paymentInfo.referralAmount) {
//               return res.status(400).json({ success: false, message: 'Referral amount is not sufficient' });
//             }

//             userForReferal.userReferrInfo.referralAmount -= paymentInfo.referralAmount;
//             userForReferal.userReferrInfo.referredLogs.push({ type: 'debit', amount, description });
//             await userForReferal.save({ session });
//           }

//           if (paymentInfo.useWallet) {
//             const wallet = await Wallet.findOne({ 'userId': user.userId }).session(session);
//             if (!wallet) {
//               return res.status(400).json({ success: false, message: 'Wallet not found' });
//             }

//             if (wallet.balance < paymentInfo.walletAmount) {
//               return res.status(400).json({ success: false, message: 'Wallet amount is not sufficient' });
//             }

//             wallet.balance -= paymentInfo.walletAmount;
//             const amount = paymentInfo.walletAmount;
//             const description = 'Product purchased';
//             wallet.transactions.push({ type: 'debit', amount, description });
//             await wallet.save({ session });
//           }
//           paymentInfo.status = 'completed';
//           break;

//         case 'online':
//           if (paymentInfo.useReferral) {
//             const description = 'Product purchased';
//             const amount = paymentInfo.referralAmount;
//             const userForReferal = await User.findById(user.userId).session(session);

//             if (!userForReferal) {
//               return res.status(400).json({ success: false, message: 'Referal not found' });
//             }

//             if (userForReferal.userReferrInfo.referralAmount < paymentInfo.referralAmount) {
//               return res.status(400).json({ success: false, message: 'Referral amount is not sufficient' });
//             }

//             userForReferal.userReferrInfo.referralAmount -= paymentInfo.referralAmount;
//             userForReferal.userReferrInfo.referredLogs.push({ type: 'debit', amount, description });
//             await userForReferal.save({ session });
//           }

//           if (paymentInfo.useWallet) {
//             const wallet = await Wallet.findOne({ 'userId': user.userId }).session(session);
//             if (!wallet) {
//               return res.status(400).json({ success: false, message: 'Wallet not found' });
//             }

//             if (wallet.balance < paymentInfo.walletAmount) {
//               return res.status(400).json({ success: false, message: 'Wallet amount is not sufficient' });
//             }

//             wallet.balance -= paymentInfo.walletAmount;
//             const amount = paymentInfo.walletAmount;
//             const description = 'Product purchased';
//             wallet.transactions.push({ type: 'debit', amount, description });
//             await wallet.save({ session });
//           }
//           break;

//         default:
//           return res.status(400).json({ success: false, message: 'Not able to process payment' });
//       }
//     }
//     //=-=-=-=-=-=-=-=-=-=-=-= Payment handling ends =-=-=-=-=-=-=-=-=-=-=-=-

//     //=-=-=-=-=-=-=-=-=-=-=-= Stock deduction starts =-=-=-=-=-=-=-=-=-=-=-=-
//     for (let item of orderItems) {
//       const product = await Product.findById(item.id).session(session);
//       const subSession = await mongoose.startSession();
//       subSession.startTransaction();
//       try {
//         if (parseInt(product.stock) < parseInt(item.quantity)) {
//           await subSession.abortTransaction();
//           return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}` });
//         }

//         product.stock -= item.quantity;
//         await product.save({ session: subSession });
//         await subSession.commitTransaction();
//       } catch (error) {
//         await subSession.abortTransaction();
//         throw error;
//       } finally {
//         subSession.endSession();
//       }
//     }
//     //=-=-=-=-=-=-=-=-=-=-=-= Stock deduction ends =-=-=-=-=-=-=-=-=-=-=-=-

//     //=-=-=-=-=-=-=-=-=-=-=-= Order creation starts =-=-=-=-=-=-=-=-=-=-=-=-
//     const orderId = await generateOrderId();
//     const newOrder = new Order({
//       orderId,
//       shippingInfo,
//       orderItems,
//       user,
//       paymentInfo,
//       paidAt,
//       itemsPrice,
//       discountPrice,
//       shippingPrice,
//       totalPrice,
//       orderStatus,
//       orderedFrom,
//       deliveryInfo,
//       deliverAt,
//     });

//     const result = await newOrder.save({ session });
//     await session.commitTransaction();
//     orderLogger.info(`Order received: Order ID - ${result.orderId}, User ID - ${result.user.userId}`);
//     //=-=-=-=-=-=-=-=-=-=-=-= Order creation ends =-=-=-=-=-=-=-=-=-=-=-=-

//     //=-=-=-=-=-=-=-=-=-=-=-= Sending email starts =-=-=-=-=-=-=-=-=-=-=-=-
//     if (orderedFrom === 'app' && user.email) {
//       const shippingAddress = [
//         shippingInfo.deliveryAddress.address,
//         shippingInfo.deliveryAddress.locality,
//         shippingInfo.deliveryAddress.landmark,
//         shippingInfo.deliveryAddress.city,
//         shippingInfo.deliveryAddress.pin_code,
//         shippingInfo.deliveryAddress.state
//       ].filter(value => value).join(', ');

//       const items = orderItems || [];
//       const to = user.email;
//       const subject = 'Order placed at Fresh Vegie for ' + result.orderId;
//       const htmlContent = `
//         <html>
//         <body>
//           <h1>Order Placed Successfully!</h1>
//           <p>Order Number: ${result.orderId}</p>
//           <p>Order Date: ${result.createdAt}</p>
//           <p>Total Amount: ${totalPrice}</p>
//           <p>Shipping Address: ${shippingAddress}</p>
//           <p>Estimated Delivery Date: ${result.deliverAt}</p>
//           <h3>Items Ordered:</h3>
//           <ul>${items.map(item => `<li>${item.name} - ${item.quantity} - ${item.item_price}</li>`).join('')}</ul>
//         </body>
//         </html>
//       `;

//       const transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 587,
//         secure: false,
//         auth: { user: 'fortune.solutionpoint@gmail.com', pass: 'rsyh xzdk cfgo vdak' }
//       });

//       try {
//         await transporter.sendMail({ from: 'fortune.solutionpoint@gmail.com', to, subject, html: htmlContent });
//       } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
//       }
//     }
//     //=-=-=-=-=-=-=-=-=-=-=-= Sending email ends =-=-=-=-=-=-=-=-=-=-=-=-

//     return res.status(201).json({ success: true, message: 'New order created successfully', data: newOrder });
//   } catch (error) {
//     await session.abortTransaction();
//     orderLogger.error(`Error creating order: ${error}, User ID - ${req.body.user.userId}`);
//     return res.status(500).json({ success: false, message: 'Failed to create new order', error: error.message });
//   } finally {
//     session.endSession();
//   }
// });

exports.createNewOrder = catchAsyncError(async (req, res, next) => {
  console.time('createNewOrder Execution Time');  // Start timer

  const {
    shippingInfo,
    orderItems,
    user,
    paymentInfo,
    paidAt,
    itemsPrice,
    discountPrice,
    shippingPrice,
    totalPrice,
    orderStatus,
    deliverAt,
    orderedFrom,
    deliveryInfo,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    //=-=-=-=-=-=-=-=-=-=-=-= Payment handling starts =-=-=-=-=-=-=-=-=-=-=-=-
    const handlePayment = async (paymentInfo, userId, session) => {
      if (paymentInfo) {
        switch (paymentInfo.payment_type) {
          case 'cod':
            if (paymentInfo.useReferral) {
              const userForReferral = await User.findById(userId).session(session);
              if (!userForReferral) throw new Error('Referral not found');
              if (userForReferral.userReferrInfo.referralAmount < paymentInfo.referralAmount) {
                throw new Error('Referral amount is insufficient');
              }
              userForReferral.userReferrInfo.referralAmount -= paymentInfo.referralAmount;
              userForReferral.userReferrInfo.referredLogs.push({
                type: 'debit',
                amount: paymentInfo.referralAmount,
                description: 'Product purchased'
              });
              await userForReferral.save({ session });
            }

            if (paymentInfo.useWallet) {
              const wallet = await Wallet.findOne({ userId }).session(session);
              if (!wallet) throw new Error('Wallet not found');
              if (wallet.balance < paymentInfo.walletAmount) {
                throw new Error('Wallet amount is insufficient');
              }
              wallet.balance -= paymentInfo.walletAmount;
              wallet.transactions.push({
                type: 'debit',
                amount: paymentInfo.walletAmount,
                description: 'Product purchased'
              });
              await wallet.save({ session });
            }
            paymentInfo.status = 'completed';
            break;
          default:
            throw new Error('Payment type not recognized');
        }
      }
    };
    //=-=-=-=-=-=-=-=-=-=-=-= Payment handling ends =-=-=-=-=-=-=-=-=-=-=-=-

    //=-=-=-=-=-=-=-=-=-=-=-= Stock deduction starts (BULK WRITE) =-=-=-=-=-=-=-=-=-=-=-=-
    const handleStockUpdate = async (orderItems, session) => {
      const bulkOps = orderItems.map(item => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $inc: { stock: -item.quantity } },
        }
      }));
      await Product.bulkWrite(bulkOps, { session });
    };
    //=-=-=-=-=-=-=-=-=-=-=-= Stock deduction ends =-=-=-=-=-=-=-=-=-=-=-=-

    // Process payment and stock update in parallel
    const paymentPromise = handlePayment(paymentInfo, user.userId, session);
    const stockPromise = handleStockUpdate(orderItems, session);
    await Promise.all([paymentPromise, stockPromise]);

    //=-=-=-=-=-=-=-=-=-=-=-= Order creation starts =-=-=-=-=-=-=-=-=-=-=-=-
    const orderId = await generateOrderId();
    const newOrder = new Order({
      orderId,
      shippingInfo,
      orderItems,
      user,
      paymentInfo,
      paidAt,
      itemsPrice,
      discountPrice,
      shippingPrice,
      totalPrice,
      orderStatus,
      orderedFrom,
      deliveryInfo,
      deliverAt,
    });

    await newOrder.save({ session });

    await session.commitTransaction(); // Commit the transaction

    orderLogger.info(`Order received: Order ID - ${newOrder.orderId}, User ID - ${newOrder.user.userId}`);

    //=-=-=-=-=-=-=-=-=-=-=-= Sending email starts (after transaction) =-=-=-=-=-=-=-=-=-=-=-=-
    if (orderedFrom === 'app' && user.email) {
      const sendOrderEmail = async (to, order, shippingInfo, orderItems, totalPrice, deliveryDate,user) => {
        const shippingAddress = [
          shippingInfo.deliveryAddress.address,
          shippingInfo.deliveryAddress.locality,
          shippingInfo.deliveryAddress.landmark,
          shippingInfo.deliveryAddress.city,
          shippingInfo.deliveryAddress.pin_code,
          shippingInfo.deliveryAddress.state
        ].filter(Boolean).join(', ');

        const items = orderItems || [];
        const subject = 'Order placed at Fresh Vegie for ' + order.orderId;
        const createdAtUTC = new Date(newOrder.createdAt);

          // Convert to IST (UTC + 5:30)
          const createdAtIST = new Date(createdAtUTC.getTime() + (5.5 * 60 * 60 * 1000));

          // Format the IST date as a string (customize as needed)
          const orderDateIST = createdAtIST.toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' 
          });

          // Add 1 day for estimated delivery date
          const estimatedDeliveryDate = new Date(createdAtIST);
          estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 1);
          const formattedDeliveryDate = estimatedDeliveryDate.toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
          });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                }
                .header h1 {
                    color: #4caf50;
                    font-size: 28px;
                    margin: 0;
                }
                .order-details {
                    margin: 20px 0;
                }
                .order-details p {
                    margin: 10px 0;
                }
                .order-details .bold {
                    font-weight: bold;
                }
                .order-items {
                    border: 1px solid #ddd;
                    padding: 10px;
                    margin: 20px 0;
                }
                .order-items h3 {
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                    color: #333;
                }
                .order-items ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .order-items li {
                    padding: 10px 0;
                    border-bottom: 1px solid #ddd;
                }
                .order-items li:last-child {
                    border-bottom: none;
                }
                .contact-info {
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                    border-radius: 8px;
                    text-align: center;
                }
                .contact-info p {
                    margin: 0;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Placed Successfully!</h1>
                </div>
                <p>Dear <strong>${user.name}</strong>,</p>
                <p>Thank you for shopping with <strong>Fresh Vegie</strong>. We're happy to inform you that your order has been placed successfully. Below are the details:</p>
                <div class="order-details">
                    <p class="bold">Order Number: ${newOrder.orderId}</p> 
                    <p class="bold">Order Date: ${orderDateIST}</p> 
                    <p class="bold">Total Amount: ${newOrder.grandTotal}</p>
                </div>
                <div class="order-details">
                    <p class="bold">Shipping Address: ${shippingAddress}</p>
                    <p class="bold">Estimated Delivery Date ${formattedDeliveryDate}</p>
                </div>
                <div class="order-items">
                    <h3>Items Ordered</h3>
                    <ul>
                        ${items.map(item => `<li>${item.name} - ${item.quantity} - ${item.item_price}</li>`).join('')}
                    </ul>
                </div>
                    <p>If you have any questions, feel free to contact our support team:</p>
                    <p>Email: fortune.solutionpoint@gmail.com</p>
                    <p>Phone: 9167992130</p>
                </div>
                <div class="footer">
                    <p>If you did not place this order, please contact us immediately at fortune.solutionpoint@gmail.com.</p>
                </div>
            </div>
        </body>
        </html>
    `;

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: 'fortune.solutionpoint@gmail.com', pass: 'rsyh xzdk cfgo vdak' }
        });

        await transporter.sendMail({ from: 'fortune.solutionpoint@gmail.com', to, subject, html: htmlContent });
      };

      sendOrderEmail(user.email, newOrder, shippingInfo, orderItems, totalPrice, newOrder.deliverAt,user)
        .catch(err => console.error('Failed to send email:', err));
    }

    console.timeEnd('createNewOrder Execution Time');  // End timer and log execution time

    return res.status(201).json({ success: true, message: 'New order created successfully', data: newOrder });
  } catch (error) {
    console.error('Error in createNewOrder:', error);  // Log the error

    await session.abortTransaction(); // Abort the transaction on error
    return res.status(500).json({ success: false, message: 'Failed to create new order', error: error.message });
  } finally {
    session.endSession();  // End the session in any case
  }
});



exports.createNewOrderForOnlinePayment = catchAsyncError(async (req, res, next) => {

  const {
    shippingInfo,
    orderItems,
    user,
    paymentInfo,
    paidAt,
    itemsPrice,
    discountPrice,
    shippingPrice,
    totalPrice,
    orderStatus,
    deliverAt,
    orderedFrom,
    deliveryInfo,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try { 
          //=-=-=-=-=-=-=-=-=-=-=-= Payment handling starts =-=-=-=-=-=-=-=-=-=-=-=-
    const handlePayment = async (paymentInfo, userId, session) => {
      if (paymentInfo) {
        switch (paymentInfo.payment_type) {
          case 'online':
            if (paymentInfo.useReferral) {
              const userForReferral = await User.findById(userId).session(session);
              if (!userForReferral) throw new Error('Referral not found');
              if (userForReferral.userReferrInfo.referralAmount < paymentInfo.referralAmount) {
                throw new Error('Referral amount is insufficient');
              }
              userForReferral.userReferrInfo.referralAmount -= paymentInfo.referralAmount;
              userForReferral.userReferrInfo.referredLogs.push({
                type: 'debit',
                amount: paymentInfo.referralAmount,
                description: 'Product purchased'
              });
              await userForReferral.save({ session });
            }

            if (paymentInfo.useWallet) {
              const wallet = await Wallet.findOne({ userId }).session(session);
              if (!wallet) throw new Error('Wallet not found');
              if (wallet.balance < paymentInfo.walletAmount) {
                throw new Error('Wallet amount is insufficient');
              }
              wallet.balance -= paymentInfo.walletAmount;
              wallet.transactions.push({
                type: 'debit',
                amount: paymentInfo.walletAmount,
                description: 'Product purchased'
              });
              await wallet.save({ session });
            }
            paymentInfo.status = 'pending';
            break;
          default:
            throw new Error('Payment type not recognized');
        }
      }
    };
    //=-=-=-=-=-=-=-=-=-=-=-= Payment handling ends =-=-=-=-=-=-=-=-=-=-=-=-

    //=-=-=-=-=-=-=-=-=-=-=-= Stock deduction starts (BULK WRITE) =-=-=-=-=-=-=-=-=-=-=-=-
    const handleStockUpdate = async (orderItems, session) => {
      const bulkOps = orderItems.map(item => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $inc: { stock: -item.quantity } },
        }
      }));
      await Product.bulkWrite(bulkOps, { session });
    };
    //=-=-=-=-=-=-=-=-=-=-=-= Stock deduction ends =-=-=-=-=-=-=-=-=-=-=-=-

    // Process payment and stock update in parallel
    const paymentPromise = handlePayment(paymentInfo, user.userId, session);
    const stockPromise = handleStockUpdate(orderItems, session);
    await Promise.all([paymentPromise, stockPromise]);

    //=-=-=-=-=-=-=-=-=-=-=-= Order creation starts =-=-=-=-=-=-=-=-=-=-=-=-
    const orderId = await generateOrderId();
    const newOrder = new Order({
      orderId,
      shippingInfo,
      orderItems,
      user,
      paymentInfo,
      paidAt,
      itemsPrice,
      discountPrice,
      shippingPrice,
      totalPrice,
      orderStatus,
      orderedFrom,
      deliveryInfo,
      deliverAt,
    });

    await newOrder.save({ session });

    await session.commitTransaction(); // Commit the transaction

    orderLogger.info(`Order received: Order ID - ${newOrder.orderId}, User ID - ${newOrder.user.userId}`);

    //=-=-=-=-=-=-=-=-=-=-=-= Sending email starts (after transaction) =-=-=-=-=-=-=-=-=-=-=-=-
    if (orderedFrom === 'app' && user.email) {
      const sendOrderEmail = async (to, order, shippingInfo, orderItems, totalPrice, deliveryDate,user) => {
        const shippingAddress = [
          shippingInfo.deliveryAddress.address,
          shippingInfo.deliveryAddress.locality,
          shippingInfo.deliveryAddress.landmark,
          shippingInfo.deliveryAddress.city,
          shippingInfo.deliveryAddress.pin_code,
          shippingInfo.deliveryAddress.state
        ].filter(Boolean).join(', ');

        const items = orderItems || [];
        const subject = 'Order placed at Fresh Vegie for ' + order.orderId;
        const createdAtUTC = new Date(newOrder.createdAt);

          // Convert to IST (UTC + 5:30)
          const createdAtIST = new Date(createdAtUTC.getTime() + (5.5 * 60 * 60 * 1000));

          // Format the IST date as a string (customize as needed)
          const orderDateIST = createdAtIST.toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' 
          });

          // Add 1 day for estimated delivery date
          const estimatedDeliveryDate = new Date(createdAtIST);
          estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 1);
          const formattedDeliveryDate = estimatedDeliveryDate.toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
          });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                }
                .header h1 {
                    color: #4caf50;
                    font-size: 28px;
                    margin: 0;
                }
                .order-details {
                    margin: 20px 0;
                }
                .order-details p {
                    margin: 10px 0;
                }
                .order-details .bold {
                    font-weight: bold;
                }
                .order-items {
                    border: 1px solid #ddd;
                    padding: 10px;
                    margin: 20px 0;
                }
                .order-items h3 {
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                    color: #333;
                }
                .order-items ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .order-items li {
                    padding: 10px 0;
                    border-bottom: 1px solid #ddd;
                }
                .order-items li:last-child {
                    border-bottom: none;
                }
                .contact-info {
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                    border-radius: 8px;
                    text-align: center;
                }
                .contact-info p {
                    margin: 0;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Placed Successfully!</h1>
                </div>
                <p>Dear <strong>${user.name}</strong>,</p>
                <p>Thank you for shopping with <strong>Fresh Vegie</strong>. We're happy to inform you that your order has been placed successfully. Below are the details:</p>
                <div class="order-details">
                    <p class="bold">Order Number: ${newOrder.orderId}</p> 
                    <p class="bold">Order Date: ${orderDateIST}</p> 
                    <p class="bold">Total Amount: ${newOrder.grandTotal}</p>
                </div>
                <div class="order-details">
                    <p class="bold">Shipping Address: ${shippingAddress}</p>
                    <p class="bold">Estimated Delivery Date ${formattedDeliveryDate}</p>
                </div>
                <div class="order-items">
                    <h3>Items Ordered</h3>
                    <ul>
                        ${items.map(item => `<li>${item.name} - ${item.quantity} - ${item.item_price}</li>`).join('')}
                    </ul>
                </div>
                    <p>If you have any questions, feel free to contact our support team:</p>
                    <p>Email: fortune.solutionpoint@gmail.com</p>
                    <p>Phone: 9167992130</p>
                </div>
                <div class="footer">
                    <p>If you did not place this order, please contact us immediately at fortune.solutionpoint@gmail.com.</p>
                </div>
            </div>
        </body>
        </html>
    `;

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: 'fortune.solutionpoint@gmail.com', pass: 'rsyh xzdk cfgo vdak' }
        });

        await transporter.sendMail({ from: 'fortune.solutionpoint@gmail.com', to, subject, html: htmlContent });
      };

      sendOrderEmail(user.email, newOrder, shippingInfo, orderItems, totalPrice, newOrder.deliverAt,user)
        .catch(err => console.error('Failed to send email:', err));
    }

    console.timeEnd('createNewOrder Execution Time');  // End timer and log execution time

    return res.status(201).json({ success: true, message: 'New order created successfully', data: newOrder });

  } catch (error) {
    console.error('Error in createNewOrder:', error);  // Log the error

    await session.abortTransaction(); // Abort the transaction on error
    return res.status(500).json({ success: false, message: 'Failed to create new order', error: error.message });
  } finally {
    session.endSession();
  }
})



// send user orders
exports.getUserOrders = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  if (!userId) {
    return next(new ErrorHandler('Order not found', 400));
  }

  try {
    const order = await Order.aggregate([
      { $match: { 'user.userId': mongoose.Types.ObjectId(userId) } }, // Match the user's orders
      {

        $project: {
          orderId: 1,
          orderItems: { $sortArray: { input: "$orderItems", sortBy: { name: 1 } } }, // Sort orderItems alphabetically by name
          shippingInfo: 1,
          user: 1,
          paymentInfo: 1,
          paidAt: 1,
          itemsPrice: 1,
          discountPrice: 1,
          shippingPrice: 1,
          totalPrice: 1,
          orderStatus: 1,
          deliverAt: 1,
          createdAt: 1,
          updatedAt: 1,
          id: 1,
        }
      },
      { $sort: { createdAt: -1 } },
    ]);
    if (!order) {
      return next(new ErrorHandler('Order not found', 200));
    }
    const totalOrders = await Order.countDocuments();
    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error while getting order: ', error);
    throw new ErrorHandler('Unable to generate orderId', 500);
  }

});

// send all orders
exports.getAllOrders = catchAsyncError(async (req, res, next) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const orders = await Order.aggregate([
    {
      $addFields: {
        timestampFormatted: {
          $dateToString: {
            format: "%d %B %Y, %H:%M:%S",
            date: "$createdAt",
            timezone: 'Asia/Kolkata'
          }
        }
      }
    },
    {
      $project: {
        orderId: { $ifNull: ["$orderId", 'N/A'] },
        timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
        user: { $ifNull: ["$user.name", "N/A"] },
        totalItems: { $ifNull: [{ $size: "$orderItems" }, "N/A"] },
        weight: { $ifNull: ["$total_quantity", "N/A"] },
        location: { $ifNull: ["$shippingInfo.deliveryAddress.state", "N/A"] },
        payment_status: { $ifNull: ["$paymentInfo.status", "N/A"] },
        order_status: { $ifNull: ["$orderStatus", "N/A"] },
        grand_total: { $ifNull: ["$grandTotal", "N/A"] },
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);
  if (!orders) {
    return next(new ErrorHandler('No order found', 400));
  }
  const totalOrders = await Order.countDocuments();
  res.status(200).json({
    success: true,
    page,
    limit,
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
    data: orders
  });
});

// update order status
exports.updateOrderStatus = catchAsyncError(async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(new ErrorHandler('Order not found', 400));
    }
    if (!req.body.status) {
      return next(new ErrorHandler('Invalid request', 400));
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorHandler('Order not found', 200));
    }

    order.orderStatus = req.body.status;

    if (req.body.status === 'delivered') {
      order.deliveredAt = Date.now();
    }
    const result = await order.save({ validateBeforeSave: false });
    if (!result) {
      throw new ErrorHandler('Not able to update');
    }

    const data = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $project: {
          orderId: 1,
          user: {
            userId: 1
          },
          orderStatus: 1
        }
      }
    ]);
    if (!data) {
      throw new ErrorHandler('Not able to update');
    }
    orderLogger.info(`Order status updated for Order ID - ${data[0].orderId} to ${req.body.status} for User ID - ${data[0].user.userId}`);
    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error while getting updating order', 500);
    orderLogger.info(`Order status updation failed for Order ID - ${data[0].orderId} to ${data[0].orderStatus} for User ID - ${data[0].user.userId}`);
  }
});

// delete order
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler('Order not found', 400));
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler('Order not found', 200));
  }
  await order.remove();
  res.status(200).json({
    success: true,
    message: 'Order deleted',
  });
});

const updateStock = async (id, quantity) => {
  const product = await Product.findById(id);
  if (product.stock < quantity) {
    return false;
  }
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
  return true;
};

exports.getOrderWithItems = catchAsyncError(async (req, res, next) => {
  console.log('we hit here --')
  const orderId = req.params.orderId;
  console.log(orderId);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const orderWithItems = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          orderItems: {
            $slice: [
              {
                $map: {
                  input: "$orderItems",
                  as: "item",
                  in: {
                    name: { $ifNull: ["$$item.name", "N/A"] },
                    item_price: { $ifNull: ["$$item.item_price", "N/A"] },
                    quantity: { $ifNull: ["$$item.quantity", "N/A"] },
                    image: { $ifNull: ["$$item.image", "N/A"] },
                    item_total_discount: { $ifNull: ["$$item.item_total_discount", "N/A"] },
                    item_total_tax: { $ifNull: ["$$item.item_total_tax", "N/A"] },
                    item_total: { $ifNull: ["$$item.item_total", "N/A"] }
                  }
                }
              },
              skip,
              limit
            ]
          },
          total_discount: { $ifNull: ["$total_discount", "N/A"] },
          total_item_count: { $ifNull: ["$total_item_count", "N/A"] },
          total_tax: { $ifNull: ["$total_tax", "N/A"] },
          items_grand_total: { $ifNull: ["$items_grand_total", "N/A"] },
          grand_total: { $ifNull: ["$grandTotal", "N/A"] }
        }
      }
    ]);
    if (!orderWithItems) {
      throw new ErrorHandler('Dont found worth');
    }
    const totalItems = orderWithItems[0].orderItems.length;
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPage: Math.ceil(totalItems / limit),
      totalItems: totalItems,
      data: orderWithItems
    });
  } catch (error) {
    console.error('Error generating orderId:', error);
    throw new ErrorHandler('Unable to generate orderId', 500);
  }
});

exports.getOrderHistoryByUserId = catchAsyncError(async (req, res, next) => {

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orderHistory = await Order.aggregate([
      {
        $match: { 'user.userId': mongoose.Types.ObjectId(req.params.userId) }
      },
      {
        $addFields: {
          timestampFormatted: {
            $dateToString: {
              format: "%d %B %Y, %H:%M:%S",
              date: "$createdAt",
              timezone: "UTC"
            }
          }
        }
      },
      {
        $project: {
          orderId: { $ifNull: ["$orderId", "N/A"] },
          timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
          totalItems: { $ifNull: [{ $size: "$orderItems" }, "N/A"] },
          orderStatus: { $ifNull: ["$orderStatus", "N/A"] },
          deliveryType: { $ifNull: ["$deliveryType", "N/A"] },
          totalPrice: { $ifNull: ["$totalPrice", "N/A"] }
        }
      },
      { $sort: { createdAt: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);
    if (!orderHistory) {
      throw new ErrorHandler('Some thing went wrong');
    }
    console.log(orderHistory);
    return res.status(200).json({
      success: true,
      page,
      limit,
      total: orderHistory.length,
      totalPage: Math.ceil(orderHistory.length / limit),
      data: orderHistory
    });
  } catch (error) {
    console.error('Error while getting history of order', 500, error.message);
    throw new ErrorHandler('Not able to get order history');
  }
});

exports.getUserBillingInfoByOrderId = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    throw new ErrorHandler('Order not found', 400);
  }
  try {
    const userBillingInfo = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          name: { $ifNull: ['$shippingInfo.billingAddress.name', 'N/A'] },
          phone: { $ifNull: ['$shippingInfo.billingAddress.phone', 'N/A'] },
          email: { $ifNull: ['$shippingInfo.billingAddress.email', 'N/A'] },
          address: { $ifNull: ['$shippingInfo.billingAddress.address', 'N/A'] },
          locality: { $ifNull: ['$shippingInfo.billingAddress.locality', 'N/A'] },
          landmark: { $ifNull: ['$shippingInfo.billingAddress.landmark', 'N/A'] },
          city: { $ifNull: ['$shippingInfo.billingAddress.city', 'N/A'] },
          pin_code: { $ifNull: ['$shippingInfo.billingAddress.pin_code', 'N/A'] },
          state: { $ifNull: ['$shippingInfo.billingAddress.state', 'N/A'] }
        }
      }
    ]);
    if (!userBillingInfo.length) {
      return next(new ErrorHandler('Billing information not found', 404));
    }
    res.status(200).json({
      success: true,
      userBillingInfo: userBillingInfo
    });
  } catch (error) {
    console.error('Error while getting user history of order', 500, error.message);
    throw new ErrorHandler('Not able to get user history');
  }
});

exports.getUserPaymentDetailByOrderId = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    throw new ErrorHandler('Order not found', 400);
  }
  try {
    const userPaymentDetail = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          _id: 0,
          paymentType: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
          status: { $ifNull: ["$paymentInfo.status", "N/A"] },
          amount: { $ifNull: ["$paymentInfo.amount", "N/A"] },
          usedelivery: { $ifNull: ["$paymentInfo.usedelivery", "false"] },
          deliverycharges: { $ifNull: ["$paymentInfo.deliverycharges", "0"] },
          useReferral: { $ifNull: ["$paymentInfo.useReferral", "false"] },
          referralAmount: { $ifNull: ["$paymentInfo.referralAmount", "0"] },
          useWallet: { $ifNull: ["$paymentInfo.useWallet", "false"] },
          walletAmount: { $ifNull: ["$paymentInfo.walletAmount", "0"] },
        }
      }
    ]);
    if (!userPaymentDetail.length) {
      return next(new ErrorHandler('User payment status not found', 404));
    }
    res.status(200).json({
      success: true,
      userPaymentDetail: userPaymentDetail[0]
    });
  } catch (error) {
    console.error('Error while getting user history of order', 500, error.message);
    throw new ErrorHandler('Not able to get user history');
  }
});

exports.getUserDeliveryInfoByOrderId = catchAsyncError(async (req, res, next) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    throw new ErrorHandler('Order not found', 404);
  }
  try {
    const userDeliveryDetail = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          _id: 0,
          deliveryType: { $ifNull: ["$deliveryInfo.deliveryType", "N/A"] },
          deliveryCost: { $ifNull: ["$deliveryInfo.deliveryCost", "N/A"] },
          name: { $ifNull: ["$deliveryInfo.deliveryPartner.name", "N/A"] },
          phone: { $ifNull: ["$deliveryInfo.deliveryPartner.phone", "N/A"] },
          email: { $ifNull: ["$deliveryInfo.deliveryPartner.email", "N/A"] }
        }
      }
    ]);
    if (!userDeliveryDetail.length) {
      return next(new ErrorHandler('Delivery detail not found', 404));
    }
    res.status(200).json({
      success: true,
      userDeliveryDetail: userDeliveryDetail[0]
    })
  } catch (error) {
    console.error('Error while getting user delivery details of the order', 500, error.message);
    throw new ErrorHandler('Not able to get user delivery info');
  }
});

exports.getCustomOrderIdByOrderId = (catchAsyncError(async (req, res, next) => {

  const orderId = req.params.orderId;
  try {
    const customOrderId = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          orderId: { $ifNull: ["$orderId", "N/A"] }
        }
      }
    ]);
    if (!customOrderId) {
      throw new ErrorHandler('Order not found', 404);
    }
    res.status(200).json({
      success: true,
      data: customOrderId[0]
    });
  } catch (error) {
    console.log(error.message);
    throw new ErrorHandler('Something wrong happend', 400);
  }
}));

exports.updatePaymentStatusByOrderId = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required in the request body'
      });
    }

    // Find the order by orderId and update the paymentInfo.status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      {
        'paymentInfo.status': status
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Something wrong happened while updating order'
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

exports.getQuantityWiseOrderByOrderId = (catchAsyncError(async (req, res, next) => {

  try {
    const orderId = req.params.orderId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const quantityWiseOrder = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          orderItems: {
            $slice: [
              {
                $map: {
                  input: "$orderItems",
                  as: "item",
                  in: {
                    name: { $ifNull: ["$$item.name", "N/A"] },
                    quantity: { $ifNull: ["$$item.quantity", "N/A"] },
                    image: { $ifNull: ["$$item.image", "N/A"] }
                  }
                }
              },
              skip,
              limit
            ]
          },
          total_quantity: { $ifNull: ["$total_quantity", "N/A"] }
        }
      }
    ]);
    if (!quantityWiseOrder) {
      throw new ErrorHandler('Not found', 500);
    }
    const totalItems = quantityWiseOrder[0].orderItems.length;
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPage: Math.ceil(totalItems / limit),
      totalItems: totalItems,
      data: quantityWiseOrder[0]
    });
  } catch (error) {
    console.error(error.message);
    throw new ErrorHandler('Something went wrong', 400);
  }
}));

exports.markOrderStatusPaidByOrderId = (catchAsyncError(async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const { amount } = req.body;
    console.log(amount);
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'amount is required in the request body'
      });
    }
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      {
        'paymentInfo.status': "completed",
        'paymentInfo.amount': amount
      },
      { new: true, runValidators: true }
    );
    console.log(updatedOrder);
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Something wrong happened while updating order',
      });
    }
    res.status(200).json({
      success: true,
      message: `Order status updated to Paid`,
      order: updatedOrder
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something wrong happend while updating order status');
  }
}));

exports.markOrderStatusToCancelledByOrderId = (catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const cancelledOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { 'orderStatus': 'canceled' },
      { new: true, runValidators: true }
    );
    if (!cancelledOrder) {
      return res.status(404).json({
        success: false,
        message: 'something wrong happed while updating order status to cancelled'
      });
    }
    const data = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          orderId: 1,
          user: {
            userId: 1
          },
          orderStatus: 1
        }
      }
    ]);
    if (!data) {
      throw new ErrorHandler('Not able to update');
    }
    orderLogger.info(`Order status updated for Order ID - ${data[0].orderId} to canceled for User ID - ${data[0].user.userId}`);
    return res.status(200).json({
      success: true,
      message: 'Updated successfully',
      data: cancelledOrder
    });

  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Some thing wrong happed while updating order status');
  }
}));

exports.getSingleOrderStatusByOrderId = (catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    console.log(orderId);
    const orderStatus = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          status: { $ifNull: ["$orderStatus", "N/A"] }
        }
      }
    ]);
    return res.status(200).json({
      success: true,
      data: orderStatus[0]
    });
  } catch (error) {
    console.error(error.message);
    throw new ErrorHandler('Something went wrong while getting order status');
  }
}));

exports.markOrderStatusAsDeliveredByOrderId = (catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const deliveredStatusOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      {
        'orderStatus': 'delivered',
        'deliverAt': Date.now()
      }
    );
    if (!deliveredStatusOrder) {
      return res.status(404).json({
        success: false,
        message: 'Not able to marked order status as delivered'
      });
    }
    const data = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) }
      },
      {
        $project: {
          orderId: 1,
          user: {
            userId: 1
          },
          orderStatus: 1
        }
      }
    ]);
    if (!data) {
      throw new ErrorHandler('Not able to update');
    }
    orderLogger.info(`Order status updated for Order ID - ${data[0].orderId} to delivered for User ID - ${data[0].user.userId}`);
    return res.status(200).json({
      success: true,
      data: deliveredStatusOrder
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong', 404);
  }
}));

exports.getOrderByOrderIdForUser = (catchAsyncError(async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    let logs;
    if (!orderId) {
      throw new ErrorHandler('orderId not valid', 404);
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    const OrderForUser = await Order.findById({ _id: orderId }).session(session);
    if (!OrderForUser) {
      throw new ErrorHandler('Not found');
    }
    console.log(OrderForUser);
    const subSession = await mongoose.startSession();
    subSession.startTransaction();
    try {
      const orderLogCollection = mongoose.connection.collection('orderLogs');
      logs = await orderLogCollection.aggregate([
        {
          $match: {
            message: { $regex: `Order ID - ${OrderForUser.orderId}`, $options: 'i' },
          },
        },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$message", regex: /received/ } }, then: 'received' },
                  { case: { $regexMatch: { input: "$message", regex: /accepted/ } }, then: 'accepted' },
                  { case: { $regexMatch: { input: "$message", regex: /processing/ } }, then: 'processing' },
                  { case: { $regexMatch: { input: "$message", regex: /packed/ } }, then: 'packed' },
                  { case: { $regexMatch: { input: "$message", regex: /assign_delivery/ } }, then: 'assign_delivery' },
                  { case: { $regexMatch: { input: "$message", regex: /out for delivery/ } }, then: 'out for delivery' },
                  { case: { $regexMatch: { input: "$message", regex: /transit/ } }, then: 'transit' },
                  { case: { $regexMatch: { input: "$message", regex: /delivered/ } }, then: 'delivered' },
                  { case: { $regexMatch: { input: "$message", regex: /verifying payment/ } }, then: 'verifying payment' },
                  { case: { $regexMatch: { input: "$message", regex: /canceled/ } }, then: 'canceled' },
                  { case: { $regexMatch: { input: "$message", regex: /failed/ } }, then: 'failed' }
                ],
                default: "Unknown"
              }
            },
            time: {
              $dateToString: {
                format: "%Y-%m-%d %H:%M:%S",
                date: { $add: ["$timestamp", 19800000] } // Add 5 hours 30 minutes (in milliseconds)
              }
            }
          }
        },
        {
          $project: {
            status: 1,
            time: 1
          }
        },
        { $sort: { time: 1 } }
      ]).toArray();
      console.log(logs);
      await subSession.endSession();
    } catch (error) {
      await subSession.abortTransaction();
      console.log(error.message);
      throw new ErrorHandler('Something went wrong');
    }
    await session.endSession();
    res.status(200).json({
      success: true,
      logs: logs,
      data: OrderForUser,
    });
  } catch (error) {
    console.error('error while getting, order by Id');
    throw new ErrorHandler('Some thing went wrong while getting order by order Id');
  }
}));

exports.updateDeliveryDetailsToOrder = (catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const {
      type,
      name,
      phone,
      email,
      _id
    } = req.body;
    console.log(req.body);
    const deliveryPartnerDetails = await Order.findOneAndUpdate(
      { _id: orderId },
      {
        'deliveryInfo.deliveryType': type === '1' ? 'Third party delivery partner' : 'In house delivery partner' || null,
        'deliveryInfo.deliveryPartner.name': name || null,
        'deliveryInfo.deliveryPartner.phone': isNaN(phone) ? null : phone,
        'deliveryInfo.deliveryPartner.email': email || null,
        'deliveryInfo.deliveryPartner.deliveryPartnerId' : _id || null
      },
      {new: true}
    );
    if (!deliveryPartnerDetails) {
      return res.status(404).json({
        success: false,
        message: 'Not able to update delivery partner details'
      });
    }
    return res.status(200).json({
      success: true,
      data: deliveryPartnerDetails
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong while updating delivery partner details');
  }
}));


exports.getOrderForDashboardCards = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    let totalOrders = null;
    let matchCondition = {};

    if (status === 'pending') {
      matchCondition.orderStatus = { $eq: 'received' };
      totalOrders = await Order.countDocuments({ 'orderStatus': 'received' });
    }

    if (status === 'delivered') {
      matchCondition.orderStatus = { $eq: 'delivered' };
      totalOrders = await Order.countDocuments({ 'orderStatus': 'delivered' });
    }

    if (status === 'total_order') {
      matchCondition = {};
      totalOrders = await Order.countDocuments({});
    }


    const orders = await Order.aggregate([
      {
        $match: matchCondition
      },
      {
        $addFields: {
          timestampFormatted: {
            $dateToString: {
              format: "%d %B %Y, %H:%M:%S",
              date: "$createdAt",
              timezone: 'Asia/Kolkata' // Change this to IST
            }
          }
        }
      },
      {
        $project: {
          order_no: { $ifNull: ["$orderId", 'N/A'] },
          timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
          customerName: { $ifNull: ["$user.name", "N/A"] },
          orderItemsCount: { $ifNull: [{ $size: "$orderItems" }, "N/A"] },
          totalQuantity: { $ifNull: ["$total_quantity", "N/A"] },
          location: { $ifNull: ["$shippingInfo.deliveryAddress.state", "N/A"] },
          paymentType: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
          status: { $ifNull: ["$orderStatus", "N/A"] },
          amount: { $ifNull: ["$grandTotal", "N/A"] },
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    if (!orders) {
      return next(new ErrorHandler('No order found', 400));
    }

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      data: orders
    });

  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong while updating delivery partner details');
  }
});

exports.getOrderForEditOrder = catchAsyncError(async (req, res, next) => {
  try {
    console.log('we in order for e0')
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const order = await Order.aggregate([
      {
        $match: {_id: mongoose.Types.ObjectId(req.params.orderId)}
      },
      {
        $project: {
          orderItems: {
            $slice: [
              {
                $map: {
                  input: "$orderItems",
                  as: "item",
                  in: {
                    name: {$ifNull: ["$$item.name", "N/a"]},
                    image: {$ifNull: ["$$item.image", "N/a"]},
                    quantity: {$ifNull: ["$$item.quantity", "N/a"]},
                    item_price: {$ifNull: ["$$item.item_price", "N/a"]},
                    offer_price: {$ifNull: ["$$item.offer_price", "N/a"]},
                    incrementvalue: {$ifNull: ["$$item.incrementvalue", "N/a"]},
                    maxquantity: {$ifNull: ["$$item.maxquantity", "N/a"]},
                    minquantity: {$ifNull: ["$$item.minquantity", "N/a"]},
                    unit: {$ifNull: ["$$item.unit", "N/a"]},
                  }
                }
              },
              skip,
              limit
            ]
          },
          orderId: {$ifNull: ["$orderId", "N/a"]},
          isDeliveryUsed: {$ifNull: ["$paymentInfo.usedelivery", "N/a"]},
          deliverycharges: {$ifNull: ["$paymentInfo.deliverycharges", "N/a"]},
          discountPrice: {$ifNull: ["$discountPrice", "N/a"]},
          amount: {$ifNull: ["$paymentInfo.amount", "N/a"]},
          userId: {$ifNull: ["$user.userId", "N/a"]},
          paymentInfo: 1,
        },
      }
    ]);
    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong getting order for edit order');
  }
});


exports.getOrderForCustomize = catchAsyncError (async (req, res, next) => {
  try {
    const result = await Order.findById(req.params.id);
    if(!result) {
      throw new ErrorHandler('Something went wrong getting the order');
    }
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong getting the order');

  }
});

exports.updateOrderByAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const {
      orderItems,
      paymentInfo,
      discountPrice,
      grandTotal
    } = req.body;
    const updatedData = {
      orderItems,
      paymentInfo,
      discountPrice,
      grandTotal
    }
    console.log(updatedData);
    const result = await Order.findByIdAndUpdate(req.params.orderId, 
      {$set: updatedData}, 
      {new: false}
    );
    if(!result) {
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    } 
    return res.status(200).json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error(error);
    throw new ErrorHandler('Something went wrong getting the order');
  }
})

exports.updateOrderStatusAfterPayment = catchAsyncError(async (req, res, next) => {
  try {

    const {orderId} = req.body;
    console.log(req.body);

    const updatedOrderStatusAfterPayment = await Order.findByIdAndUpdate(
      orderId,
      {
        'paymentInfo.status': "completed",
        'paidAt': new Date() 
      },
      { new: true } 
    );

    return res.status(200).json({
      success: true,
      data: updatedOrderStatusAfterPayment, 
      message: "Order status updated successfully."
    });

  } catch (error) {
    console.error(error);
    next(new ErrorHandler('Something went wrong updating the order', 500)); 
  }
});

