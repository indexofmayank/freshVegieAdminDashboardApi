const router = require('express').Router();
const csvController = require('../controllers/csvController');

router.route('/').get(csvController.createCSVfileForOrder);

module.exports = router;