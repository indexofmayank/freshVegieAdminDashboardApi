require('dotenv').config();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Product = require('./models/productModel');
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
// MongoDB connection
// const uri = "your_mongo_connection_string";
// const client = new MongoClient(process.env.DB_URI);
// console.log(process.env.DB_URI);
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "fortune.solutionpoint@gmail.com",
      pass: "rsyh xzdk cfgo vdak",
    },
  });
  


// Cron job to check for low stock and notify users
// 0 21 * * *
//
cron.schedule('0 21 * * *', async () => {
  console.log('Running low stock reminder job at 9 pm every day');

  try {
    // Fetch low stock products
    const lowStockProducts = await Product.aggregate([
      {
        $match: { product_status: true }, // Match only products with product_status = true
      },
      {
        $project: {
          name: 1,
          image: { $arrayElemAt: ["$images.secure_url", 0] },
          stock: 1,
          price: 1,
          offer_price: 1,
          stock_notify: 1,
          purchase_price: 1,
        },
      },
      {
        $match: { $expr: { $lte: ["$stock", "$stock_notify"] } }, // Filter low-stock products
      },
    ]);
    
    //   console.log("asdaddasa",lowStockProducts.length);
    //   console.log(lowStockProducts);

    // If there are low stock products, send email notifications
    // console.log(lowStockProducts.length);
    if (lowStockProducts.length > 0) {
        const emailBody = `
        <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left;">Name</th>
              <th style="text-align: center;">Image</th>
              <th style="text-align: center;">Current Stock</th>
              <th style="text-align: center;">Price</th>
              <th style="text-align: center;">Offer Price</th>
              <th style="text-align: center;">Purchase Price</th>
            </tr>
          </thead>
          <tbody>
            ${lowStockProducts
              .map(
                (product) => `
                  <tr>
                    <td>${product.name}</td>
                    <td style="text-align: center;">
                      <img src="${product.image}" alt="${product.name}" width="50" height="50" />
                    </td>
                    <td style="text-align: center;">${product.stock}</td>
                    <td style="text-align: center;">${product.price}</td>
                    <td style="text-align: center;">${product.offer_price || 'N/A'}</td>
                    <td style="text-align: center;">${product.purchase_price || 'N/A'}</td>
                  </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      

      const mailOptions = {
        from: "fortune.solutionpoint@gmail.com",
        to: 'fortune.solutionpoint@gmail.com',
        bcc: 'pandey.avinash26@gmail.com',
        subject: 'Low Stock Reminder',
        html: `<h2>Low Stock Products</h2>${emailBody}`,
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Low stock email sent successfully');
    } else {
      console.log('No low stock products at this time');
    }
  } catch (error) {
    console.error('Error in low stock cron job:', error);
  } finally {
    // await client.close();
  }
});
