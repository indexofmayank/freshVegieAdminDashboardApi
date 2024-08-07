const router = require('express').Router();
const bannerController = require('../controllers/bannerController');

//create new order
router.route('/').post(bannerController.createBanner);
router.route('/').get(bannerController.getAllBanner);
router.route('/:bannerId').put(bannerController.updateBanner);

module.exports = router;