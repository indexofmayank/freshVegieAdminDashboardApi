const router = require('express').Router();

const inventoryController = require('../controllers/inventoryController');

router.route('/').get(inventoryController.getAllProductsForInventory);

module.exports = router;