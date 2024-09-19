const router = require('express').Router();
const dealofthedayController = require('../controllers/dealofthedayController');

router.route('/').post(dealofthedayController.createDealoftheday);

module.exports = router;