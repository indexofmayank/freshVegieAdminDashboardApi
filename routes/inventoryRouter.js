const router = require('express').Router();

const inventoryController = require('../controllers/inventoryController');

router.route('/').get(inventoryController.getAllProductsForInventory);
router.route('/').put(inventoryController.updateProductForInventory);

module.exports = router;    