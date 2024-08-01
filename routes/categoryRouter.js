const router = require('express').Router();
const categoryController = require('../controllers/categoryController');

router.route('/').get(categoryController.getAllCategroy);
router.route('/').post(categoryController.createCategory);
router.route('/:id').get(categoryController.getCategoryById);

module.exports = router;