const User = require('../models/userModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

exports.createUser = catchAsyncError(async (req, res, next) => {

    const { name, phone, email, address } = req.body;
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

exports.getAllUser = catchAsyncError(async (req, res, next) => {

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

exports.getUserById = catchAsyncError(async (req, res, next) => {

    if (!req.params.id) {
        return next(new ErrorHandler('User Not found', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler('User Not Found', 200));
    }

    res.status(200).json({
        success: true,
        data: user
    });

});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
    console.log('we hit here')
    if (!req.params.id) {
        return next(new ErrorHandler('User not found', 400));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler('User not found', 200));
    }
    await user.remove();
    res.status(200).json({
        success: true,
        message: 'User deleted'
    })
});

exports.getUserByPhoneNumber = catchAsyncError(async (req, res, next) => {
    try {
        const { phone } = req.params;
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

exports.getUpdateUser = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await User.findByIdAndUpdate(id, updateData, { new: false });
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

exports.addUserAddress = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name, phone, email, address, locality, landmark, city, pin_code, state } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                data: 'User not found'
            });
        }
        const result = user.address.push(
            { name, phone, email, address, locality, landmark, city, pin_code, state }
        );
        await user.save();
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

exports.editUserAddress = catchAsyncError(async (req, res, next) => {
    const { userId, addressId } = req.params;
    const updatedAddress = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.address[addressIndex] = { ...user.address[addressIndex]._doc, ...updatedAddress };
        await user.save();

        res.status(200).json({ message: 'Address updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

