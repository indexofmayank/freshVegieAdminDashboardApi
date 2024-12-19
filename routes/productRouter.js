const router = require('express').Router();

const productController = require('../controllers/productController');

router.route('/').get(productController.getAllProducts);
router.route('/exportproductdata').get(productController.getAllproductExportCSV);
router.route('/:id').get(productController.getSingleProduct);

router.route('/reviews').post(productController.createProductReview);

router.route('/reviews/:id').get(productController.getAllReviews);
router.route('/category/:categoryId', ).get(productController.getProductByCategory);
router.route('/dropdown/getProductForDropdown').get(productController.getProductForDropdown);
router.route('/dropdown/getProductForCreateOrder').get(productController.getProductDropdownForCreateOrder);
router.route('/dropdown-name/name/').get(productController.getActiveProductNameForDropdown);
// router.route('/getAllProductForOrder/').get(productController.getAllProductForOrder);
router.route('/dropdown/forsearch/').get(productController.getAllProductNameForSearchQuery);
router.route('/getnow/expermintedRouteToTest').get(productController.experimentedRouteToTest);
router.route('/getnow/experimentedRouteToTestTwo').get(productController.experimentedRouteToTestTwo);

module.exports = router;
