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
    const { skip = 0, limit = 10 } = req.query;
    const skipInt = parseInt(skip);
    const limitInt = parseInt(limit);
    let wallet = ''

    try {
        if (limit === 'all') {
            wallet = await Wallet.aggregate([
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
                        userName: { $ifNull: ['$userDetails.name', 'Unknown User'] }
                    }
                },
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
                        'transactions.description': { $ifNull: ['$transactions.description', 'No Description'] }
                    }
                },
                {
                    $sort: {
                        'transactions.date': -1
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
                        transactions: 1
                    }
                },
            ]);

        } else {
            wallet = await Wallet.aggregate([
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
                        userName: { $ifNull: ['$userDetails.name', 'Unknown User'] }
                    }
                },
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
                        'transactions.description': { $ifNull: ['$transactions.description', 'No Description'] }
                    }
                },
                {
                    $sort: {
                        'transactions.date': -1
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
                },
            ]);

        }

        console.log(wallet);

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

    const {skip = 0, limit = 10} = req.query;
    const skipInt = parseInt(skip);
    const limitInt = parseInt(limit);
    try {
        const { amount, description = 'Funds Added' } = req.body;
        const wallet = await Wallet.findOne({ 'userId': req.params.id });
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        wallet.balance += parseInt(amount);
        wallet.transactions.push({ type: 'credit', amount, description });
        await wallet.save();
        const result = await Wallet.aggregate([
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
                    userName: { $ifNull: ['$userDetails.name', 'Unknown User'] }
                }
            },
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
                    'transactions.description': { $ifNull: ['$transactions.description', 'No Description'] }
                }
            },
            {
                $sort: {
                    'transactions.date': -1
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
            },
        ]);

        return res.status(200).json({
            success: true,
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

exports.getWalletBalanceByUserId = CatchAsyncErrors(async (req, res, next) => {
    try {
        const balance = await Wallet.aggregate([
            {
                $match: {'userId': mongoose.Types.ObjectId(req.params.id)}
            },
            {
                $project: {
                    balance:{ $ifNull: ["$balance", "N/a"]}
                }
            }
        ]);
        console.log(balance);
        return res.status(200).json({
            success: true,
           balance
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: 'Server error'
        })
    }
});

const moment = require('moment-timezone');

exports.getWalletBalanceByUserIdForLogs = CatchAsyncErrors(async (req, res, next) => {
    try {
        const userId = mongoose.Types.ObjectId(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalTransactions = await Wallet.aggregate([
            { $match: { userId: userId } },
            { $project: { totalTransactions: { $size: "$transactions" } } }
        ]);

        const total = totalTransactions.length > 0 ? totalTransactions[0].totalTransactions : 0;

        const logs = await Wallet.aggregate([
            {
                $match: { 'userId': userId }
            },
            {
                $project: {
                    transactions: {
                        $slice: [
                            {
                                $map: {
                                    input: "$transactions",
                                    as: "log",
                                    in: {
                                        type: { $ifNull: ["$$log.type", "N/a"] },
                                        amount: { $ifNull: ["$$log.amount", "N/a"] },
                                        description: { $ifNull: ["$$log.description", "N/a"] },
                                        // Format the date in 'Asia/Kolkata' timezone
                                        date: {
                                            $cond: {
                                                if: { $eq: ["$$log.date", null] },
                                                then: "N/a",
                                                else: {
                                                    $dateToString: {
                                                        format: "%Y-%m-%d %H:%M:%S",
                                                        date: "$$log.date",
                                                        timezone: "Asia/Kolkata"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            skip, 
                            limit 
                        ]
                    }
                }
            }
        ]);

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalPages,
            totalTransactions: total,
            logs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching logs',
            error: error.message
        });
    }
});

exports.addAmountByAdminToWallet = CatchAsyncErrors(async (req, res, next) => {
    try {
        const {amount, description = 'Funds Added By Admin'} = req.body;
        const wallet = await Wallet.findOne({'userId': req.params.id});
        if(!wallet) {
            throw new Error('Wallet not found');
        }
        wallet.balance += parseInt(amount);
        wallet.transactions.push({type: 'credit', amount, description});
        await wallet.save();

        return res.status(200).json({
            success: true,
            message: 'Amount added successfully'
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            error: error.message
        })
    }
})
