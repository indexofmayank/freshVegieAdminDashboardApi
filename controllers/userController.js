const User = require('../models/userModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');

exports.getAllUser = catchAsyncError(async (req, res, next) => {

    const users = await User.find();
    if(!users) {
        res.status(200).json({success : false, message: 'No user found'});
    }
    res.status(200).json({
    success: true,
    data: users
    });
});

exports.createUser = catchAsyncError(async (req, res, next) => {
    const { name, email, phone, address } = req.body;

    // Check if the phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Phone number already exists',
        });
    }

    // Create a new user
    const user = await User.create({
        name,
        email,
        phone,
        address,
    });

    res.status(201).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
        },
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
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({
            success: false,
             message: 'Server error', error: error.message
        });
    }
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await User.findByIdAndUpdate(id, updateData, { new: false });
        if(!result) {
            return res.status(500).json({success: false, message: 'server error'});
        } else {
            try {
                const updatedUser = await User.findById(id);
                if(!updatedUser) {
                    return res.status(500).json({success: false, message: 'server error'});
                }
                return res.status(200).json({success: true, data: updatedUser});
            } catch (error) {
                res.status(500).json({success: false, message: 'server error', error: message});
            }
        }
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message });
    }
});

exports.addUserAddress = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name, phone, email, address, locality, landmark, city, pin_code, state } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) {
            return next(new ErrorHandler('User not found', 200));
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
        return next(new ErrorHandler('Server Error', 500));
    }
});

exports.editUserAddress = catchAsyncError(async (req, res, next) => {
    const { userId, addressId } = req.params;
    const updatedAddress = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.address[addressIndex] = { ...user.address[addressIndex]._doc, ...updatedAddress };
        await user.save();
            //have to check
        res.status(200).json({success: true, message: 'Address updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

exports.deleteAddress = async (req, res) => {
    const { userId, addressId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.address.splice(addressIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Address deleted successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

