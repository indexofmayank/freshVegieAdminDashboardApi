const router = require('express').Router();

const orderController = require('../controllers/orderController');

// create new order
router.route('/new').post(orderController.createNewOrder);

// send user orders
router.route('/users/:userId').get(orderController.getUserOrders);

// send single order
router.route('/:orderId').get(orderController.getOrderWithItems);

router.route('/history/:userId').get(orderController.getOrderHistoryByUserId);


module.exports = router;    
    