const router = require('express').Router();

const orderController = require('../controllers/orderController');

// create new order
router.route('/new').post(orderController.createNewOrder);

// send user orders
router.route('/users/:userId').get(orderController.getUserOrders);
router.route('/:orderId').get(orderController.getOrderByOrderIdForUser);
// send single order
router.route('/orderItems/:orderId').get(orderController.getOrderWithItems);

router.route('/history/:userId').get(orderController.getOrderHistoryByUserId);
router.route('/billingInfo/:orderId').get(orderController.getUserBillingInfoByOrderId);
router.route('/paymentInfo/:orderId').get(orderController.getUserPaymentDetailByOrderId);
router.route('/deliveryInfo/:orderId').get(orderController.getUserDeliveryInfoByOrderId);
router.route('/customOrderId/:orderId').get(orderController.getCustomOrderIdByOrderId);
router.route('/paymentstatus/:orderId').put(orderController.updatePaymentStatusByOrderId);
router.route('/quantitywise/:orderId').get(orderController.getQuantityWiseOrderByOrderId);
router.route('/markpaid/:orderId').put(orderController.markOrderStatusPaidByOrderId);
router.route('/orderstatus/:orderId').get(orderController.getSingleOrderStatusByOrderId);
router.route('/markdelivered/:orderId').put(orderController.markOrderStatusAsDeliveredByOrderId);
router.route('/deliverypartnerdetails/:orderId').put(orderController.updateDeliveryDetailsToOrder);
router.route('/dashboardcard/orders/').get(orderController.getOrderForDashboardCards);
router.route('/orderforedit/:orderId').get(orderController.getOrderForEditOrder);
router.route('/orderforcustomise/:id').get(orderController.getOrderForCustomize);
router.route('/newforonline').post(orderController.createNewOrderForOnlinePayment);
// router.route('/editorder/:orderId').get(orderController)
router.route('/updateOrderStatusAfterPayment').post(orderController.updateOrderStatusAfterPayment);
router.route('/getOrderIdByCustomOrderId/:customOrderId').get(orderController.getCustomOrderIdByOrderIdTwo);
router.route('/readeabledate/:orderId').get(orderController.getDateOfOrderByOrderId);
router.route('/lasttenorder/orderforsearch').get(orderController.getLastTenOrderForOrderSearch);
router.route('/cancellByDemand/:orderId').get(orderController.cancelledOrderById);


module.exports = router;    