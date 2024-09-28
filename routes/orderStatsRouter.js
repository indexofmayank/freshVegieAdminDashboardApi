const router = require('express').Router();
const orderStatusController = require('../controllers/orderStatusController');

router.route('/').get(orderStatusController.getOrderStatus);
router.route('/count/').get(orderStatusController.getTotalOrders);
router.route('/average/').get(orderStatusController.getTotalAverageOrders);
router.route('/totalsales/').get(orderStatusController.getTotalSales);
router.route('/totaldelivered/').get(orderStatusController.getDeliveredOrderNumber);
router.route('/totalpending/').get(orderStatusController.getPendingOrderNumber);

module.exports = router;