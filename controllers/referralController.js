const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');
const Referral = require('../models/referModel');

exports.getReferralInfoByUserId = catchAsyncError(async (req, res, next) => {
    try {

        const referralInfo = await Referral.aggregate([
            {
                $match: {'referrerId': mongoose.Types.ObjectId(req.params.id)}
            },
            {
                $project: {
                    referralCode: {$ifNull: ["$referralCode", 'N/a']},
                    reward: {$ifNull: ["$reward", 'N/a']}
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: referralInfo,

        });
    } catch (error) {
        console.log('Serveer error', error);
        throw new ErrorHandler('Serever error', 500);
    }
});

exports.getReferralCodeByUserId = catchAsyncError (async (req, res, next) => {
    try {
        const code = await Referral.aggregate([
            {
                $match: {'referrerId': mongoose.Types.ObjectId(req.params.id)}
            },
            {
                $project: {
                    referralCode: {$ifNull: ["$referralCode", 'N/a']},
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: code[0]?.referralCode || 'N/a'
        })
    } catch (error) {
        console.log('Serveer error', error);
        throw new ErrorHandler('Serever error', 500);

    }
});

exports.updateReferralInfoForReferred = catchAsyncError (async (req, res, next) => {
    try {  
        const result = await Referral.findByIdAndUpdate(req.params.id, {
            'referredUserId' : mongoose.Types.ObjectId(req.params.referredId)
        });
        if(!result) {
            throw new ErrorHandler('Serever error', 500);
        }

        return res.status(200).json({
            success: true,
            data: 'Referred added successfully'
        });
    } catch (error) {
        console.log('Serveer error', error);
        throw new ErrorHandler('Serever error', 500);
    }
});

exports.updateReferralAmount = catchAsyncError(async (req, res, next) => {
    try {
        const result = await Referral.findByIdAndUpdate(req.params.id, {
            'reward' : req.body.amount
        });
        if(!result) {
            throw new ErrorHandler('Serever error', 500);
        }

        return res.status(200).json({
            success: true,
            data: 'Reward updated successfully'
        });

    } catch (error) {
        console.log('Serveer error', error);
        throw new ErrorHandler('Serever error', 500);
    }
});