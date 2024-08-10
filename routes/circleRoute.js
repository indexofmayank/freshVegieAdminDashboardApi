const router = require('express').Router();
const circleController = require('../controllers/circleController');

router.route('/').post(circleController.createCircle);
router.route('/').get(circleController.getCircle);

module.exports = router;