const DemoProduct = require('../models/demoProductModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const Category = require('../models/categoryModel');

const upload = multer({ dest: 'uploads/' });





// Helper function to transform category names to their ObjectId
async function transformKeysAndCategory(row) {
    const transformedRow = { ...row }; 
    const categories = await Category.find();

    // Create a mapping of category name to ObjectId    
    const categoryMap = {};
    categories.forEach(category => {
        categoryMap[category.name] = category._id;  
    });

    console.log(categoryMap);
    console.log(transformedRow.category);


    // Check if the category exists in the map and replace it with the corresponding ObjectId
    if (transformedRow.category && categoryMap[transformedRow.category]) {
        transformedRow.category = categoryMap[transformedRow.category];
    } else {
        console.warn(`Category not found for ${transformedRow.category}. Skipping row.`);
        return null;  // Return null to indicate the row should be skipped
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

        const results = [];
        const processingPromises = []; // Store promises for all row transformations

        const stream = fs.createReadStream(req.file.path)
            .pipe(csv({ separator: '\t' }));

        stream.on('data', (data) => {
            // Push the promise for each row transformation into an array
            processingPromises.push(
                transformKeysAndCategory(data)
                    .then((transformedData) => {
                        if (transformedData) { // Only add if transformedData is not null
                            console.log('Transformed Data:', transformedData); // Log each transformed row
                            results.push(transformedData);
                        }
                    })
                    .catch((error) => {
                        console.error('Error transforming row:', error);
                        return next(new ErrorHandler(error.message, 400));  
                    })
            );
        });

        stream.on('end', async () => {
            console.log('Stream finished processing CSV data'); // Check if this is reached
            
            // Wait for all rows to be processed
            await Promise.all(processingPromises);
            console.log('All rows processed:', results); // Log processed results

            // Insert all transformed data into the DemoProduct collection
            try {
                const mayank = await DemoProduct.insertMany(results);
                console.log('Inserted documents:', mayank); // Log inserted data
                return res.status(200).json({
                    success: true,
                    message: 'CSV file processed and data inserted successfully',
                    data: results,  // All transformed data
                });
            } catch (error) {
                console.error('Error inserting data:', error);
                return next(new ErrorHandler('Failed to insert data into DemoProduct', 500));
            } finally {
                // Clean up the uploaded file
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('Uploaded file removed successfully');
                    }
                });
            }
        });

        stream.on('error', (error) => {
            console.error('Stream Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error reading CSV file',
                error: error.message,
            });
        });
    })
];
