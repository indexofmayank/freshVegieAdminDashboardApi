const router = require('express').Router();
const polygonController = require('../controllers/polygonController');

router.route('/').post(polygonController.createPolygon);
router.route('/').get(polygonController.getAllPolygon);
router.route('/:polygonId').put(polygonController.updatePolygon);
router.route('/:polygonId').delete(polygonController.deletePolygon);
router.route('/:polygonId').get(polygonController.getPolygonById);
module.exports = router;