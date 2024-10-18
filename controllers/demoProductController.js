const DemoProduct = require('../models/demoProductModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const Category = require('../models/categoryModel');

const upload = multer({ dest: 'uploads/' });

function generateRandomPublicId() {
  return Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
}



async function getCategoryMapping() {
    // Fetch the category mapping from MongoDB collection
    // const categories = Category;
    const categories = await Category.find();
    
    // Create a mapping object: { categoryId: categoryName }
    const mapping = {};
    categories.forEach(cat => {
        mapping[cat.name.toLowerCase()] = cat._id; // Assuming categoryName and _id fields
      });
    return mapping;
  }



function transformKeysAndCategory(row, categoryMapping) {
    const transformedRow = {};
    
    for (const key in row) {
      let newKey = key.replace(/\s+/g, '').toLowerCase(); 

      if (newKey === 'category') {
        const categoryName = row[key].toLowerCase(); 
        transformedRow['category'] = categoryMapping[categoryName] || null; 
       } else if (newKey === 'images') {
          transformedRow['images'] = [{
            public_id: generateRandomPublicId(),
            secure_url: row[key]
          }];
      } else {
        transformedRow[newKey] = row[key];
      }
    }
    
    return transformedRow;
  }

exports.updateLoadProductCSV = [
    upload.single('file'),
    catchAsyncError(async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }
        const categoryMapping = await getCategoryMapping();
        const products = [];
        const processingPromises = []; // Store promises for all row transformations
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
              .pipe(csv())
              .on('data', (row) => {
                const transformedRow = transformKeysAndCategory(row, categoryMapping);
                products.push(transformedRow);
              })
              .on('end', async () => {
                try {
                  const result = await DemoProduct.insertMany(products);
                  console.log('${result.insertedCount} products inserted successfully.');
                  resolve();
                } catch (err) {
                  reject(err);
                }
              })
              .on('error', (err) => {
                reject(err);
              });
          });
      
          return res.status(200).json({ success: true, message: `${products.length} products inserted. `});
        
    })
];

exports.getDemoProductModal = catchAsyncError(async(req, res, next) => {
  try {
    const result = await DemoProduct.find();
    if(!result) {
      return res.status(500).json({
        success: false,
        message: 'server error'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'it'
    })
  } catch (error) {
    console.error(error);
    res.status(200).json({
      success: true,
      message: 'server error'
    })
  }
})
