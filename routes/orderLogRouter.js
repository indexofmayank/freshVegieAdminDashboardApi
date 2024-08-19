const router = require('express').Router();
const orderLogController = require('../controllers/orderLogController');


router.route('/:userId').get(orderLogController.getOrderLogsByUserId);
router.route('/test/:userId').get(orderLogController.getTest);

module.exports = router;