const router = require('express').Router();
const polygonController = require('../controllers/polygonController');

router.route('/').post(polygonController.createPolygon);
router.route('/').get(polygonController.getAllPolygon);
router.route('/simple/polygons').get(polygonController.getSimplePolygon);
router.route('/:polygonId').put(polygonController.updatePolygon);
router.route('/:polygonId').delete(polygonController.deletePolygon);
router.route('/:polygonId').get(polygonController.getPolygonById);
router.route('/active/polygon').get(polygonController.getActivePolygon);
module.exports = router;