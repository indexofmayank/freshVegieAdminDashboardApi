const ErrorHandler = require('../utils/ErrorHandler');
const Asset = require('../models/assetModel');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const multer = require('multer');
const unzipper = require('unzipper');
const upload = multer({ dest: '/tmp/upload' });
const fs = require('fs');
const path = require('path');
const os = require('os');
const cloudinary = require('../config/cloudinary');
async function uploadToCloudinary(filePath) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'tomper-wear',
        });
        console.log('Upload successful:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return null;
    }
}

exports.uploadAssetZip = [
    upload.single('file'),
    catchAsyncError(async(req, res, next) => {
        const zipFilePath = req.file.path;
        console.log(__dirname);
        const extractedFolder = path.join('upload', 'extracted_images');
        if(!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log(req.file);
        try {
            // Create a folder for extracted images
            if (!fs.existsSync(extractedFolder)) {
                fs.mkdirSync(extractedFolder, { recursive: true });
              }
          
              await new Promise((resolve, reject) => {
                fs.createReadStream(zipFilePath)
                    .pipe(unzipper.Extract({ path: extractedFolder }))
                    .on('close', resolve)
                    .on('error', reject);
            });

            console.log('Files extracted successfully.');
        
    const imagePaths = [];

    // Unzip the file and extract the images
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Parse())
      .on('entry', async (entry) => {
        const fileName = entry.path;
        const type = entry.type;

        // Only process image files
        if (type === 'File' && /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
          const filePath = path.join(extractedFolder, fileName);
          entry.pipe(fs.createWriteStream(filePath));
          imagePaths.push({ filePath, fileName });
        } else {
          entry.autodrain();
        }
      })
      .on('close', async () => {
        const uploadedImages = [];

        // Upload each extracted image to Cloudinary and store the URLs in MongoDB
        for (const imageInfo of imagePaths) {
            const { filePath, fileName } = imageInfo;
          const url = await uploadToCloudinary(filePath);

          if (url) {
            // Save the URL to MongoDB
            // const imageDoc = new Image({ url });
            const localImageName = path.basename(fileName);
            const imageDoc = new Asset({ image:url, name: localImageName });
            await imageDoc.save();

            uploadedImages.push(url);

            // Clean up local file after upload
            fs.unlinkSync(filePath);
          }
        }

        // Send response with Cloudinary URLs
        return res.json({ 
            success: true,
            message: 'Uploaded successfully'
         });
      });
           
          } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to upload images.' });
          } finally {
            // Clean up temporary files
          //  fs.unlinkSync(zipFilePath);
          }


        return res.status(200).json({
            success: true,
            message: 'it working'
        });
    })
];



exports.getAssetForTable = catchAsyncError (async(req, res, next) => {
    try {
        const {name} = req.query;
        const matchCondition = name ? {"name" : {$regex: name, $options: "i"}} : {};
        console.log(matchCondition);
        const result = await Asset.aggregate([
            {
                $match: matchCondition
            },
            {
                $project: {
                    name: {$ifNull: ["$name", "N/a"]},
                    image: {$ifNull: ["$image", "N/a"]}
                }
            }
        ]);


        if(!result) {
            return res.status(200).json({
                success: false,
                message: 'Not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});