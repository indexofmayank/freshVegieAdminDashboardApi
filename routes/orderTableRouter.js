const router = require('express').Router();

const orderTableController = require('../controllers/orderTableController');

router.route('/ordertablelabelwise/').get(orderTableController.getOrdersForTable);
router.route('/ordertableforrecent/').get(orderTableController.getRecentOrderForTable);

module.exports = router;