const router = require('express').Router();

const inventoryController = require('../controllers/inventoryController');

router.route('/').get(inventoryController.getAllProductsForInventory);
router.route('/').put(inventoryController.updateProductForInventory);
router.route('/product-dropdown/').get(inventoryController.getProductByNameForInventory);

module.exports = router;    