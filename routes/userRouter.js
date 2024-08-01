const router = require('express').Router();

const userController = require('../controllers/userController');

//create user
router.route('/').post(userController.createUser);
router.route('/').get(userController.getAllUser);
router.route('/:id').get(userController.getUserById);

module.exports = router;