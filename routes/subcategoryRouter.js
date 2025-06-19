const router = require('express').Router();
// const categoryController = require('../controllers/categoryController');
const subcategoryController = require('../controllers/subcategoryController');

router.route('/exportcategorydata').get(subcategoryController.getAllSubCategoryExportCSV);
router.route('/').get(subcategoryController.getAllSubCategroy);
router.route('/').post(subcategoryController.createSubCategory);
router.route('/:id').get(subcategoryController.getSubCategoryById);
router.route('/:categoryId').put(subcategoryController.updateSubCategory);
router.route('/get/name/').get(subcategoryController.getAllSubCategoryByName);
// router.route('/exportcategory').get(categoryController.getAllCategoryexporttocsv);

module.exports = router;