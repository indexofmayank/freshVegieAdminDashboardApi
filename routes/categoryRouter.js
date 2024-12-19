const router = require('express').Router();
const categoryController = require('../controllers/categoryController');

router.route('/exportcategorydata').get(categoryController.getAllCategoryExportCSV);
router.route('/').get(categoryController.getAllCategroy);
router.route('/').post(categoryController.createCategory);
router.route('/:id').get(categoryController.getCategoryById);
router.route('/:categoryId').put(categoryController.updateCategory);
router.route('/get/name/').get(categoryController.getAllCategoryByName);
// router.route('/exportcategory').get(categoryController.getAllCategoryexporttocsv);

module.exports = router;