const Wallet = require('../models/walletModel');
const ErrorHandler = require('../utils/ErrorHandler');
const CatchAsyncErrors = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');


exports.createWallet = CatchAsyncErrors(async (req, res, next) => {
    try {
        let { userId, balance } = req.body;
        const wallet = await Wallet.create({ userId, balance });
        if (!wallet) {
            return next(new ErrorHandler('Server error', 500));
        }

        return res.status(200).json({
            success: true,
            message: 'Wallet created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        })
    }
});

exports.getWalletByUserId = CatchAsyncErrors(async (req, res, next) => {
    const { skip = 0, limit = 10 } = req.query; // Get skip and limit from query params
    const skipInt = parseInt(skip);
    const limitInt = parseInt(limit);

    try {
        const wallet = await Wallet.aggregate([
            {
                $match: { 'userId': mongoose.Types.ObjectId(req.params.id) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: '$userDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    timestampFormatted: {
                        $dateToString: {
                            format: "%d %B %Y, %H:%M:%S",
                            date: "$createdAt",
                            timezone: 'Asia/Kolkata'
                        }
                    },
                    userName: { $ifNull: ['$userDetails.name', 'Unknown User'] } // Default value if null
                }
            },
            // {
            //     $project: {
            //         timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
            //         userName: 1,
            //         balance: { $ifNull: ['$balance', 0] }, // Default to 0 if balance is null
            //         transactions: 1
            //     }
            // },
            {
                $unwind: {
                    path: '$transactions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    'transactions.timestampFormatted': {
                        $dateToString: {
                            format: "%d %B %Y, %H:%M:%S",
                            date: "$transactions.date",
                            timezone: 'Asia/Kolkata'
                        }
                    },
                    'transactions.description': { $ifNull: ['$transactions.description', 'No Description'] } // Default if null
                }
            },
            {
                $group: {
                    _id: '$_id',
                    userName: { $first: '$userName' },
                    balance: { $first: '$balance' },
                    transactions: { $push: '$transactions' }
                }
            },
            {
                $project: {
                    userName: 1,
                    balance: 1,
                    timestampFormatted: { $ifNull: ["$timestampFormatted", "N/A"] },
                    transactions: {
                        $slice: ['$transactions', skipInt, limitInt]
                    }
                }
            }
        ]);

        // Handle case when wallet is empty
        if (wallet.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        res.status(200).json({
            success: true,
            wallet: {
                userName: wallet[0].userName,
                balance: wallet[0].balance,
                transactions: wallet[0].transactions.length > 0 ? wallet[0].transactions : 'No Transactions Available'
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

exports.addFundsToWallet = async (req, res, next) => {
    try {
        const { amount, description = 'Funds Added' } = req.body;
        const wallet = await Wallet.findOne({ 'userId': req.params.id });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        wallet.balance += amount;
        wallet.transactions.push({ type: 'credit', amount, description });
        await wallet.save();
        const result = await Wallet.findOne({'userId': req.params.id});
        if(!result) {
            return res.status(200).json({
                success: false,
                message: 'Amount added but wallet not found'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Amount added successfully',
            data: result
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message
        })
    }
}

exports.useWalletfunds = CatchAsyncErrors(async (req, res, session) => {
    try {
        let success = false;
        const description = 'Purchase payment';
        const amount = parseInt(req.body.amount);
        const userId = req.body.user.userId;
        if (!userId) {
            throw new Error('User not found, while updating order');
        }
        const wallet = await Wallet.findOne({ 'userId': userId }).session(session);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        if (wallet.balance < amount) {
            throw new Error('Insufficient wallet balance');
        }
        wallet.balance -= amount;
        wallet.transactions.push({ type: 'debit', amount, description });
        await wallet.save();
        success = true;
        return success
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: 'Server error',
            error: error.message
        })
    }
});
