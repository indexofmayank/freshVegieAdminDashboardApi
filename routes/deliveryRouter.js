const router = require('express').Router();
const deliveryController = require('../controllers/deliveryController');

router.route('/').get(deliveryController.getDeliveryPartnerByName);
router.route('/:partnerId').get(deliveryController.getDeliveryPartnerDetailById);
router.route('/orderlist/:id').get(deliveryController.getOrderListByDeliveryPartnerId);

module.exports = router;
