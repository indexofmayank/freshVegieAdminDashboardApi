const router = require('express').Router();
const bannerController = require('../controllers/bannerController');

//create new order
router.route('/').post(bannerController.createBanner);
router.route('/').get(bannerController.getAllBanner);
router.route('/:bannerId').put(bannerController.updateBanner);
router.route('/:bannerId').get(bannerController.getBannerById);
router.route('/:bannerId').delete(bannerController.deleteBanner);
router.route('/active/banner').get(bannerController.getBannerAcitveStatus);

module.exports = router;