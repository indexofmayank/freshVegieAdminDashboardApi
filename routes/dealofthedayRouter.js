const router = require('express').Router();
const dealofthedayController = require('../controllers/dealofthedayController');

router.route('/').post(dealofthedayController.createDealoftheday);
router.route('/').get(dealofthedayController.getAllDealOfTheDayForTable);
router.route('/featuredProduct/').get(dealofthedayController.getAllFeaturedProductForTable);
router.route('/featureProduct/:id').put(dealofthedayController.updateDealOfTheDay);
router.route('/singlefeaturedProduct/:id').get(dealofthedayController.getDealOfTheDayById);

module.exports = router;