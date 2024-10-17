const router = require('express').Router();

const productController = require('../controllers/productController');

// send all product detaisl
router.route('/').get(productController.getAllProducts);

// send a single product
router.route('/:id').get(productController.getSingleProduct);

// create product review
router.route('/reviews').post(productController.createProductReview);

// send all product reviews
router.route('/reviews/:id').get(productController.getAllReviews);
router.route('/category/:categoryId', ).get(productController.getProductByCategory);
router.route('/dropdown/getProductForDropdown').get(productController.getProductForDropdown);
router.route('/dropdown/getProductForCreateOrder').get(productController.getProductDropdownForCreateOrder);
router.route('/dropdown-name/name/').get(productController.getActiveProductNameForDropdown);
// router.route('/getAllProductForOrder/').get(productController.getAllProductForOrder);
router.route('/dropdown/forsearch/').get(productController.getAllProductNameForSearchQuery);

module.exports = router;
