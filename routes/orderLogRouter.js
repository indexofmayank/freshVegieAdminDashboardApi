const router = require('express').Router();
const orderLogController = require('../controllers/orderLogController');


router.route('/:userId').get(orderLogController.getOrderLogsByUserId);

module.exports = router;