const User = require('../models/userModel');
const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');
const Referral = require('../models/referModel');
const Wallet = require('../models/walletModel');


exports.getAllUser = catchAsyncError(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    try {
        const users = await User.aggregate([
            {
                $project: {
                    name: 1,
                    phone: 1,
                    email: 1,
                    status: 1
                }
            },
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        if (!users) {
            throw new ErrorHandler('Server error', 500);
        }

        const totalUsers = await User.countDocuments();
        res.status(200).json({
            success: true,
            page,
            limit,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            data: users
        });

    } catch (error) {
        console.log('Serveer error', error);
        throw new ErrorHandler('Serever error', 500);
    }
});

exports.createUser = catchAsyncError(async (req, res, next) => {
    console.log(req.body);
    const { name, email, phone, address, device, userInfo, fcm_token
     } = req.body;


    // Check if the phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Phone number already exists',
        });
    }

    // Function to generate a unique referral code using Referral collection
    const generateUniqueReferralCode = async () => {
        let referralCode;
        let isUnique = false;

        while (!isUnique) {
            referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const existingReferral = await User.findOne({ 'userReferrInfo.referralCode': referralCode });
            if (!existingReferral) {
                isUnique = true;
            }
        }
        return referralCode;
    };

    // Generate and save a unique referral code to the Referral collection
    const referralCode = await generateUniqueReferralCode();
    const user = await User.create({
        name,
        email,
        phone,
        address,
        device,
        userInfo,
        userReferrInfo: {
            referralCode: referralCode
        },
        fcm_token
    });

    if(!user) {
        throw new Error('Something went wrong while creating user');
    }

    //create wallet for the user
    const userId = user._id;
    const balance = 0;
    const wallet = await Wallet.create({userId, balance});
    if (!wallet) {
        return next(new ErrorHandler('Server error', 500));
    }

    return res.status(201).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            referralCode: user.userReferrInfo.referralCode,
            referralAmount: user.userReferrInfo.referralAmount
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
        res.status(200).json({
            success: true,
            data: user
        });
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
        if (!result) {
            return res.status(500).json({ success: false, message: 'server error' });
        } else {
            try {
                const updatedUser = await User.findById(id);
                if (!updatedUser) {
                    return res.status(500).json({ success: false, message: 'server error' });
                }
                return res.status(200).json({ success: true, data: updatedUser });
            } catch (error) {
                res.status(500).json({ success: false, message: 'server error', error: message });
            }
        }
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

exports.addUserAddress = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { address_name, name, phone, email, address, locality, landmark, city, pin_code, state } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) {
            return next(new ErrorHandler('User not found', 200));
        }
        const result = user.address.push(
            { address_name, name, phone, email, address, locality, landmark, city, pin_code, state }
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
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.address[addressIndex] = { ...user.address[addressIndex]._doc, ...updatedAddress };
        await user.save();
        //have to check
        res.status(200).json({ success: true, message: 'Address updated successfully', user });
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


exports.getUserTranscationByUserId = catchAsyncError(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(page - 1) * limit;
        const { userId } = req.params;
        if (!userId) {
            throw new ErrorHandler('No transaction found', 400);
        }
        const transactionHistory = await Order.aggregate([
            {
                $match: { 'user.userId': mongoose.Types.ObjectId(userId) },
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
                },
            },
            {
                $project: {
                    orderId: { $ifNull: ["$orderId", "N/A"] },
                    paymentType: { $ifNull: ["$paymentInfo.payment_type", "N/A"] },
                    paymentStatus: { $ifNull: ["$paymentInfo.status", "N/A"] },
                    totalPrice: { $ifNull: ["$totalPrice", "N/A"] },
                    timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] }
                }
            },
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        if (!transactionHistory) {
            throw new ErrorHandler('No transaction found', 400);
        }

        res.status(200).json({
            success: true,
            page,
            limit,
            totalPages: Math.ceil(transactionHistory.length / limit),
            totalTransactions: transactionHistory.length,
            data: transactionHistory
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Something went wrong',
            error
        });
    }
});

exports.getUserMetaDataByUserId = catchAsyncError(async (req, res, next) => {
    const userId = req.params.userId;
    try {
        if (!userId) {
            throw new ErrorHandler('User not found', 404);
        }
        const userMetaData = await User.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(userId) }
            },
            {
                $project: {
                    name: { $ifNull: ["$name", "N/A"] },
                    email: { $ifNull: ["$email", "N/A"] },
                    phone: { $ifNull: ["$phone", "N/A"] }
                }
            }
        ]);
        res.status(200).json({
            success: true,
            data: userMetaData[0]
        });
    } catch (error) {
        console.error(error.message);
        throw new ErrorHandler('something went wrong', 500);
    }
});

exports.getUserAllAddressByUserId = catchAsyncError(async (req, res, next) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(page - 1) * limit;
    try {
        if (!userId) {
            throw new ErrorHandler('User not found', 404);
        }
        const userAddresses = await User.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(userId) }
            },
            {
                $project: {
                    address: {
                        $slice: [
                            {
                                $map: {
                                    input: "$address",
                                    as: "data",
                                    in: {
                                        address_name: { $ifNull: ["$$data.address_name", "N/A"] },
                                        name: { $ifNull: ["$$data.name", "N/A"] },
                                        phone: { $ifNull: ["$$data.phone", "N/A"] },
                                        email: { $ifNull: ["$$data.email", "N/A"] },
                                        address: { $ifNull: ["$$data.address", "N/A"] },
                                        locality: { $ifNull: ["$$data.locality", "N/A"] },
                                        landmark: { $ifNull: ["$$data.landmark", "N/A"] },
                                        city: { $ifNull: ["$$data.city", "N/A"] },
                                        state: { $ifNull: ["$$data.state", "N/A"] },
                                        pin_code: { $ifNull: ["$$data.pin_code", "N/A"] },
                                        state: { $ifNull: ["$$data.state", "N/A"] }

                                    }
                                }
                            },
                            skip,
                            limit
                        ]
                    }
                }
            },
            // { $sort: { createdAt: 1 } },
            // { $skip: skip },
            // { $limit: limit }
        ]);
        if (!userAddresses) {
            throw new ErrorHandler('Server error', 500);
        }

        console.log(userAddresses);
        res.status(200).json({
            success: true,
            page,
            limit,
            totalAddress: userAddresses.length,
            totalPage: Math.ceil(userAddresses.length / limit),
            data: userAddresses
        });
    } catch (error) {
        console.error(error.message);
        throw new ErrorHandler('Something went wrong', 500);
    }
});

exports.getUserNameDropdownForCreateOrder = catchAsyncError(async (req, res, next) => {
    try {
        const { name } = req.query;
        const matchCondition = name ? { "name": { $regex: name, $options: "i" } } : {};
        const usernames = await User.aggregate([
            {
                $match: matchCondition
            },
            {
                $project: {
                    name: { $ifNull: ["$name", "N/A"] }, // Handle missing product name
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: usernames
        });
    } catch (error) {
        console.error(error);
        throw new ErrorHandler('Something wentn wrong', 500);
    }
});

exports.getUserAllAddressByUserIdForCreateOrder = catchAsyncError(async (req, res, next) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(page - 1) * limit;
    try {
        if (!userId) {
            throw new ErrorHandler('User not found', 404);
        }
        const userAddresses = await User.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(userId) }
            },
            {
                $project: {
                    address: {
                        $slice: [
                            {
                                $map: {
                                    input: "$address",
                                    as: "data",
                                    in: {
                                        address_name: { $ifNull: ["$$data.address_name", "N/A"] },
                                        name: { $ifNull: ["$$data.name", "N/A"] },
                                        phone: { $ifNull: ["$$data.phone", "N/A"] },
                                        email: { $ifNull: ["$$data.email", "N/A"] },
                                        address: { $ifNull: ["$$data.address", "N/A"] },
                                        locality: { $ifNull: ["$$data.locality", "N/A"] },
                                        landmark: { $ifNull: ["$$data.landmark", "N/A"] },
                                        city: { $ifNull: ["$$data.city", "N/A"] },
                                        state: { $ifNull: ["$$data.state", "N/A"] },
                                        pin_code: { $ifNull: ["$$data.pin_code", "N/A"] },
                                        state: { $ifNull: ["$$data.state", "N/A"] }

                                    }
                                }
                            },
                            skip,
                            limit
                        ]
                    }
                }
            },
            // { $sort: { createdAt: 1 } },
            // { $skip: skip },
            // { $limit: limit }
        ]);
        console.log(userAddresses);
        if (!userAddresses) {
            throw new ErrorHandler('Server error', 500);
        }
        res.status(200).json({
            success: true,
            page,
            limit,
            data: userAddresses
        });
    } catch (error) {
        console.error(error.message);
        throw new ErrorHandler('Something went wrong', 500);
    }
});

exports.getUserMetaDataForCreateOrder = catchAsyncError(async (req, res, next) => {
    try {
        const userMetaInfo = await User.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(req.params.userId) }
            },
            {
                $project: {
                    name: { $ifNull: ['$name', 'N/a'] },
                    phone: { $ifNull: ['$phone', 'N/a'] },
                    email: { $ifNull: ["email", 'N/a'] }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: userMetaInfo
        });

    } catch (error) {
        console.error(error.message);
        throw new ErrorHandler('Something went wrong', 500);
    }
});

exports.updateUserReferrInfo = catchAsyncError(async (req, res, next) => {
    try {
        const { referralCode, userId } = req.body;

        // Find the user by referral code
        const user = await User.findOne({ 'userReferrInfo.referralCode': referralCode });
        const secondUser = await User.findById(userId);
        console.log(user);
        console.log(secondUser);

        // If the main user is not found, return an error
        if (!user) {
            return next(new ErrorHandler('Code is not valid', 404));
        }

        // If the second user is not found, return an error
        if (!secondUser) {
            return next(new ErrorHandler('Second user not found', 404));
        }

        // Initialize userReferrInfo if it doesn't exist
        if (!user.userReferrInfo) {
            user.userReferrInfo = { referredTo: [] }; // Initialize if undefined
        }

        // Check if the second user's ID is already in the referredTo array
        const isAlreadyReferred = user.userReferrInfo.referredTo.some(
            referred => referred.userId.toString() === secondUser._id.toString()
        );

        if (isAlreadyReferred) {
            return next(new ErrorHandler('User ID already referred', 400));
        }

        // Push the new referred ID into the referredTo array
        user.userReferrInfo.referredTo.push({
            userId: secondUser._id,
            referredAt: Date.now() // Optionally include the time they were referred
        });

        // Update user referral amounts
        user.userReferrInfo.referralAmount += parseInt(process.env.DEFAULT_REWARD_AMOUNT) || 20;
        secondUser.userReferrInfo.referralAmount += parseInt(process.env.DEFAULT_REWARD_AMOUNT) || 20;

        // Save the updated user documents
        await user.save();
        await secondUser.save();

        // Return success response
        return res.status(200).json({
            success: true,
            data: secondUser // Return the updated user or relevant information
        });
    } catch (error) {
        console.error(error.message);
        return next(new ErrorHandler('Something went wrong', 500));
    }
});

