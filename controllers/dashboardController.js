const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');


exports.getTotalSales = catchAsyncError(async (req, res, next) => {
    try {
        const result = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                }
            },{
                $addFields: {
                    totalSales: {
                        $toString: {
                            $ifNull: ["$count", "N/a"]
                        }
                    }
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: result.length > 0 ? result[0].totalSales : 0
        });
    } catch (error) {
        throw new ErrorHandler('Something went wrong while getting total sales');
    }
});