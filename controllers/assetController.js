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
        try {
        const zipFilePath = req.file.path;
        const zipFile = req.file;
        console.log(zipFilePath);

        const extractedFolder = path.join(os.tmpdir(),'upload', 'extracted_images');

        if (!zipFilePath) {
            return res.status(400).json({
                success: false,
                message: 'No ZIP file uploaded',
            });
        }

        if (!/\.(zip)$/i.test(zipFile.originalname)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ZIP file format',
            });
        }

        // console.log(req.file);
        // try {
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

        //   if (!url) {
        //     return res.status(500).json({ 
        //         success: false, 
        //         message: `Failed to upload image ${fileName} to Cloudinary` 
        //     });
        // }

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

        fs.unlinkSync(zipFile.path);

        // Send response with Cloudinary URLs
        return res.status(200).json({
            success: true,
            message: 'Images uploaded successfully from ZIP',
            images: uploadedImages,
        });
    });
    } catch (error) {
        console.error('Error processing ZIP file:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during ZIP file processing',
            error: error.message
        });
    }
}),
];

exports.imageSingleZip = [
    upload.single('file'),
    catchAsyncError(async(req, res, next) => {
        const imageFile = req.file;
        // console.log(__dirname);

        if(!imageFile) {
            return res.status(400).json({
                success: false,
                message: 'No image uploaded'
            });
        }
        // console.log(req.file);
        try {
            
            const validExtensions = /\.(jpg|jpeg|png|gif)$/i;
            const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

            if (!validExtensions.test(imageFile.originalname) || !validMimeTypes.includes(imageFile.mimetype)) {
                return res.status(400).json({ success: false, message: 'Invalid image format' });
            }
          
            const imageUrl = await uploadToCloudinary(imageFile.path);

            if (!imageUrl) {
                return res.status(500).json({ success: false, message: 'Failed to upload image' });
            }  

            const imageDoc = new Asset({ image: imageUrl, name: imageFile.originalname });
            await imageDoc.save();

            // Clean up local file
            fs.unlinkSync(imageFile.path);

            return res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                imageUrl,
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server error during image upload',error: error.message });
        }
    }),
];





exports.getAssetForTable = catchAsyncError (async(req, res, next) => {
    try {
        const {name} = req.query;
        const matchCondition = name ? {"name" : {$regex: name, $options: "i"}} : {};
        // console.log(matchCondition);
        const result = await Asset.aggregate([
            {
                $match: matchCondition
            },
            {
                $project: {
                    name: {$ifNull: ["$name", "N/a"]},
                    image: {$ifNull: ["$image", "N/a"]},
                    createdAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            },
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

exports.deleteAssetById = catchAsyncError(async (req, res, next) => {
    try {
        if(!req.params.assetId) {
            return next(new ErrorHandler('Asset not found', 400));
        }
        const asset = await Asset.findById(req.params.assetId);
        await asset.remove();
        return res.status(200).json({
            success: true,
            message: 'Asset deleted'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
})