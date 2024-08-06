const router = require('express').Router();
const bannerController = require('../controllers/bannerController');

//create new order
router.route('/').post(bannerController.createBanner);

module.exports = router;