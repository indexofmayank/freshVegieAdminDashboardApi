const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
router.route('/totalsales/').get(dashboardController.getTotalSales);

module.exports = router;