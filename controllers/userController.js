const User = require('../models/userModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

exports.createUser = catchAsyncError(async(req, res, next) => {

   const {name, phone, email, address} = req.body;
   const user = await User.create({
    name,
    phone,
    email,
    address
   });

    res.status(200).json({
        success: true,
        data: user
    });
});

exports.getAllUser = catchAsyncError(async(req, res, next) => {

    const users = await User.find();
    const data = users.map((item, index) => {
        const {
            _id: id,
            name,
            email,
            phone,
            address
        } = item;

        const newItem = {
            id,
            name,
            email,
            phone,
            address
        };
        return newItem;
    });
    res.status(200).json({
        success: true,
        data,
    });
});

exports.getUserById = catchAsyncError(async(req, res, next) => {

    if(!req.params.id) {
        return next(new ErrorHandler('User Not found', 400));
    }

    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler('User Not Found', 200));
    }

    res.status(200).json({
        success: true,
        data: user
    });

});

exports.deleteUser = catchAsyncError(async(req, res, next) => {
    console.log('we hit here')
    if(!req.params.id) {
        return next(new ErrorHandler('User not found', 400));
    }

    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler('User not found', 200));
    }
    await user.remove();
    res.status(200).json({
        success: true,
        message: 'User deleted'
    })
})