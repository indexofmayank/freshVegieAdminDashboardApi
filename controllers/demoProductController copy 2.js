const DemoProduct = require('../models/demoProductModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const Category = require('../models/categoryModel');

const upload = multer({ dest: 'uploads/' });

async function getCategoryMapping(db) {
    // Fetch the category mapping from MongoDB collection
    const categories = await db.collection('categories').find().toArray();
    
    // Create a mapping object: { categoryId: categoryName }
    const mapping = {};
    categories.forEach(cat => {
      mapping[cat.categoryId] = cat.categoryName; // assuming categoryId and categoryName fields
    });
  
    return mapping;
  }
  


  function transformKeysAndCategory(row, categoryMapping) {
    const transformedRow = {};
    
    // Iterate through each key-value pair in the row and transform keys
    for (const key in row) {
      let newKey = key.replace(/\s+/g, '').toLowerCase(); // Example: convert "Category ID" to "categoryid"
      
      // Replace Category ID with Category Name
      if (newKey === 'categoryid') {
        const categoryId = row[key];
        transformedRow['categoryname'] = categoryMapping[categoryId] || 'Unknown'; // Fallback to 'Unknown' if no mapping found
      } else {
        transformedRow[newKey] = row[key];
      }
    }
  
    return transformedRow;
  }
  
  
// Helper function to transform category names to their ObjectId



// The main function to upload CSV data to MongoDB
async function uploadCSVToMongoDB(filePath) {
    try {
      await client.connect();
      console.log('Connected successfully to MongoDB');
  
      const db = client.db(dbName);
      const categoryMapping = await getCategoryMapping(db);
      const collection = db.collection(collectionName);
  
      const products = [];
  
      // Read the CSV file and parse it
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            const transformedRow = transformKeysAndCategory(row, categoryMapping);
            products.push(transformedRow);
          })
          .on('end', async () => {
            try {
              const result = await collection.insertMany(products);
              console.log(${result.insertedCount} products inserted successfully.);
              resolve();
            } catch (err) {
              reject(err);
            }
          })
          .on('error', (err) => {
            reject(err);
          });
      });
  
      await client.close();
      return { success: true, message: ${products.length} products inserted. };
    } catch (error) {
      console.error('Error uploading CSV to MongoDB:', error);
      return { success: false, message: 'Error uploading CSV.' };
    }
  }
  
  // API endpoint to upload the CSV file
  exports.updateLoadProductCSV = [ upload.single('file'), async (req, res) => {
    const file = req.file;
  
    if (!file) {
      return res.status(400).send({ success: false, message: 'No file uploaded' });
    }
  
    try {
      // Call the function to upload the CSV to MongoDB
      const result = await uploadCSVToMongoDB(file.path);
  
      // Delete the file after processing
      fs.unlinkSync(file.path);
  
      // Send the result back to the client
      res.send(result);
    } catch (error) {
      res.status(500).send({ success: false, message: 'Failed to upload CSV' });
    }
  }];

// exports.updateLoadProductCSV = [
//     upload.single('file'),
//     catchAsyncError(async (req, res, next) => {
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No file uploaded',
//             });
//         }

//         const results = [];
//         const processingPromises = []; // Store promises for all row transformations

//         const stream = fs.createReadStream(req.file.path)
//             .pipe(csv({ separator: '\t' }));

//         stream.on('data', (data) => {
//             // Push the promise for each row transformation into an array
//             processingPromises.push(
//                 transformKeysAndCategory(data)
//                     .then((transformedData) => {
//                         if (transformedData) { // Only add if transformedData is not null
//                             console.log('Transformed Data:', transformedData); // Log each transformed row
//                             results.push(transformedData);
//                         }
//                     })
//                     .catch((error) => {
//                         console.error('Error transforming row:', error);
//                         return next(new ErrorHandler(error.message, 400));  
//                     })
//             );
//         });

//         stream.on('end', async () => {
//             console.log('Stream finished processing CSV data'); // Check if this is reached
            
//             // Wait for all rows to be processed
//             await Promise.all(processingPromises);
//             console.log('All rows processed:', results); // Log processed results

//             // Insert all transformed data into the DemoProduct collection
//             try {
//                 const mayank = await DemoProduct.insertMany(results);
//                 console.log('Inserted documents:', mayank); // Log inserted data
//                 return res.status(200).json({
//                     success: true,
//                     message: 'CSV file processed and data inserted successfully',
//                     data: results,  // All transformed data
//                 });
//             } catch (error) {
//                 console.error('Error inserting data:', error);
//                 return next(new ErrorHandler('Failed to insert data into DemoProduct', 500));
//             } finally {
//                 // Clean up the uploaded file
//                 fs.unlink(req.file.path, (err) => {
//                     if (err) {
//                         console.error('Error deleting file:', err);
//                     } else {
//                         console.log('Uploaded file removed successfully');
//                     }
//                 });
//             }
//         });

//         stream.on('error', (error) => {
//             console.error('Stream Error:', error);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Error reading CSV file',
//                 error: error.message,
//             });
//         });
//     })
// ];
