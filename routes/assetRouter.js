const router = require('express').Router();
const assetController = require('../controllers/assetController');

router.route('/').get(assetController.getAssetForTable);
router.route('/').post(assetController.uploadAssetZip);

module.exports = router;