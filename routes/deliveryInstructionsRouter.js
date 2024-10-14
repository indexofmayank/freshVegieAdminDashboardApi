const router = require('express').Router();
const deliveryInstructionsController = require('../controllers/deliveryInstructionsController');

router.route('/').post(deliveryInstructionsController.createDeliveryInstructions);
router.route('/table/').get(deliveryInstructionsController.getDeliveryInstructionsForTable);
// router.route('/').get(deliveryInstructionsController.getDeliveryInstructions);
router.route('/').get(deliveryInstructionsController.getDeliveryInstructionsById);


module.exports = router;