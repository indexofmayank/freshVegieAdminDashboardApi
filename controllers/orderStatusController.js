const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../middleware/CatchAsyncErrors');
const mongoose = require('mongoose');

exports.getOrderStatus = catchAsyncError(async (req, res, next) => {
    try {
        const { period, startDate, endDate } = req.query;
        let matchCondition = {};
        const currentDate = new Date();
        
        console.log(startDate)
        console.log(endDate);
        // Determine the matchCondition based on the period or custom date range
        if (period === 'custom' && startDate && endDate) {
            // Custom date range
            matchCondition.createdAt = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        } else {
            // Period-based logic
            switch (period) {
                case 'Day':
                    matchCondition.createdAt = {
                        $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'Week':
                    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                    const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));
                    matchCondition.createdAt = {
                        $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
                        $lt: new Date(endOfWeek.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'Month':
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());    
                    matchCondition.createdAt = {
                        $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)),
                        $lt: new Date(endOfMonth.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'Year':
                    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfYear.setHours(0, 0, 0, 0)),
                        $lt: new Date(endOfYear.setHours(23, 59, 59, 999))
                    };
                    break;
                default:
                    break;
            }
        }

        console.log(matchCondition);

        const statuses = [
            'received',
            'accepted',
            'processing',
            'packed',
            'assign_delivery',
            'out for delivery',
            'transit',
            'delivered',
            'verifying payment',
            'canceled',
            'failed',
            'pending'
        ];
        const orderStatusCounts = await Promise.all(
            statuses.map(async (status) => {
                const result = await Order.aggregate([
                    {
                        $match: { 
                            ...matchCondition, 
                            orderStatus: status 
                        }
                    },
                    {
                        $group: {
                            _id: "$orderStatus",
                            count: { $sum: 1 }
                        }
                    }
                ]);
                return { label: status.charAt(0).toUpperCase() + status.slice(1), data: result.length > 0 ? result[0].count : 0 };
            })
        );

        return res.status(200).json({
            success: true,
            orderStatus: orderStatusCounts
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('something went wrong while getting order status');
    }
});




exports.getTotalOrders = catchAsyncError(async (req, res, next) => {
    try {
        const { period, startDate, endDate } = req.query;
        let matchCondition = {};
        const currentDate = new Date();

        if (startDate && endDate) {
            // Custom date range filtering
            matchCondition.createdAt = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)), // Start of the custom start date
                $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // End of the custom end date
            };
        } else {
            // Period-based filtering
            switch (period) {
                case 'Day':
                    matchCondition.createdAt = {
                        $gte: new Date(currentDate.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)) // End of today
                    };
                    break;

                case 'Week':
                    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                    const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));
                    matchCondition.createdAt = {
                        $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)), // Start of the week
                        $lt: new Date(endOfWeek.setHours(23, 59, 59, 999)) // End of the week
                    };
                    break;

                case 'Month':
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)), // Start of the month
                        $lt: new Date(endOfMonth.setHours(23, 59, 59, 999)) // End of the month
                    };
                    break;

                case 'Year':
                    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfYear.setHours(0, 0, 0, 0)), // Start of the year
                        $lt: new Date(endOfYear.setHours(23, 59, 59, 999)) // End of the year
                    };
                    break;

                default:
                    break;
            }
        }

        // Count documents based on the matchCondition
        const totalOrderCount = await Order.aggregate([
            { $match: matchCondition },
            { $count: 'totalOrders' } 
        ]);      
        return res.status(200).json({
            success: true,
            data: totalOrderCount.length > 0 ? totalOrderCount : 0
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('something went wrong while getting total orders');
    }
});

exports.getTotalAverageOrders = (catchAsyncError(async (req, res, next) => {
    try {
        const { period, startDate, endDate } = req.query;
        let matchCondition = {};
        const currentDate = new Date();

        if (startDate && endDate) {
            // If custom date range is provided, use it
            matchCondition.createdAt = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)), // Start of the custom start date
                $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // End of the custom end date
            };
        } else {
            // If no custom date range is provided, use the period-based logic
            switch (period) {
                case 'Day':
                    matchCondition.createdAt = {
                        $gte: new Date(currentDate.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)) // End of today
                    };
                    break;

                case 'Week':
                    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                    const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));
                    matchCondition.createdAt = {
                        $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)), // Start of the week
                        $lt: new Date(endOfWeek.setHours(23, 59, 59, 999)) // End of the week
                    };
                    break;

                case 'Month':
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)), // Start of the month
                        $lt: new Date(endOfMonth.setHours(23, 59, 59, 999)) // End of the month
                    };
                    break;

                case 'Year':
                    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfYear.setHours(0, 0, 0, 0)), // Start of the year
                        $lt: new Date(endOfYear.setHours(23, 59, 59, 999)) // End of the year
                    };
                    break;

                default:
                    break;
            }
        }
        const totalOrderAverageValue = await Order.aggregate([
            {
                $match: matchCondition
            },
            {
                $group: {
                    _id: null,
                    averageValue: { $avg: "$grandTotal" }  // Calculate the average first
                }
            },
            {
                $addFields: {
                    averageValue: {
                        $toString: {
                            $ifNull: ["$averageValue", "N/A"]  // Convert the average value to a string
                        }
                    }
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: totalOrderAverageValue.length > 0 ? totalOrderAverageValue[0].averageValue : 0
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('something went wrong while getting total order average value');
    }
}));

exports.getTotalSales = catchAsyncError(async (req, res, next) => {
    try {
        const { period, startDate, endDate } = req.query;
        let matchCondition = {};
        const currentDate = new Date();

        if (startDate && endDate) {
            // If custom date range is provided, use it
            matchCondition.createdAt = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)), // Start of the custom start date
                $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // End of the custom end date
            };
        } else {
            // If no custom date range is provided, use the period-based logic
            switch (period) {
                case 'Day':
                    matchCondition.createdAt = {
                        $gte: new Date(currentDate.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)) // End of today
                    };
                    break;

                case 'Week':
                    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                    const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));
                    matchCondition.createdAt = {
                        $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)), // Start of the week
                        $lt: new Date(endOfWeek.setHours(23, 59, 59, 999)) // End of the week
                    };
                    break;

                case 'Month':
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)), // Start of the month
                        $lt: new Date(endOfMonth.setHours(23, 59, 59, 999)) // End of the month
                    };
                    break;

                case 'Year':
                    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
                    matchCondition.createdAt = {
                        $gte: new Date(startOfYear.setHours(0, 0, 0, 0)), // Start of the year
                        $lt: new Date(endOfYear.setHours(23, 59, 59, 999)) // End of the year
                    };
                    break;

                default:
                    break;
            }
        }

        const result = await Order.aggregate([
            {
                $match: matchCondition
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$grandTotal" }
                }
            },
        ]);
        return res.status(200).json({
            success: true,
            data: result.length > 0 ? result[0].totalSales : 0

            
        });
    } catch (error) {
        console.log(error);
        throw new ErrorHandler('Something went wrong while getting total sales');
    }
});

exports.getDeliveredOrderNumber = catchAsyncError(async (req, res, next) => {
    try {
        const totalNumberOfDeliveredOrdered = await Order.aggregate([
            {
                $match: {"orderStatus" : "delivered"}
            },
            {
                $group: {
                    _id: "$orderStatus",
                    count: {$sum: 1}
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: totalNumberOfDeliveredOrdered
        });
    } catch (error) {   
        throw new ErrorHandler('Something went wrong while getting the total delivered order number');
    }
});

exports.getPendingOrderNumber = catchAsyncError(async (req, res, next) => {
    try {
        const totalNumberOfPendingOrder = await Order.aggregate([
            {
                $match: {"orderStatus" : "received"}
            },
            {
                $group: {
                    _id: "$orderStatus",
                    count: {$sum: 1}
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            data: totalNumberOfPendingOrder
        });
    } catch (error) {
        throw new ErrorHandler('Something went wrong while getting the total pending order number');
    }
})

