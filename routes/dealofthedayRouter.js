const router = require('express').Router();
const dealofthedayController = require('../controllers/dealofthedayController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');

router.route('/').post(dealofthedayController.createDealoftheday);
router.route('/').get(dealofthedayController.getAllDealOfTheDayForTable);
router.route('/featuredProduct/').get(dealofthedayController.getAllFeaturedProductForTable);
router.route('/featureProduct/:id').put(dealofthedayController.updateDealOfTheDay);
router.route('/singlefeaturedProduct/:id').get(dealofthedayController.getDealOfTheDayById);
router.route('/featuredProduct1/').get(userController.userListingforAddorder);
// router.route('/featuredProduct1/').get(productController.userListingforAddorder);
router.route('/getAllProductForOrder/').get(productController.getAllProductForOrder);
router.route('/featuredProduct/').post(dealofthedayController.getFeaturedProductByName);
router.route('/body/featuredProduct/:id').put(dealofthedayController.updateDealOfTheDayWithBody);
module.exports = router;