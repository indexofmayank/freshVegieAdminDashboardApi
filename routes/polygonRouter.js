const router = require('express').Router();
const polygonController = require('../controllers/polygonController');

router.route('/').post(polygonController.createPolygon);
router.route('/').get(polygonController.getAllPolygon);
module.exports = router;