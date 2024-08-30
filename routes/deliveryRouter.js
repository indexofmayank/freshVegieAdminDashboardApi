const router = require('express').Router();
const deliveryController = require('../controllers/deliveryController');

router.route('/').get(deliveryController.getDeliveryPartnerByName);
router.route('/:partnerId').get(deliveryController.getDeliveryPartnerDetailById);

module.exports = router;
