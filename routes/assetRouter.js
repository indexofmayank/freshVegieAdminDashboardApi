const router = require('express').Router();
const assetController = require('../controllers/assetController');

router.route('/').get(assetController.getAssetForTable);
router.route('/').post(assetController.uploadAssetZip);
router.route('/image/').post(assetController.imageSingleZip);

module.exports = router;