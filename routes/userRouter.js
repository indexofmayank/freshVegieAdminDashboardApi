const router = require('express').Router();

const userController = require('../controllers/userController');

//create user
router.route('/').post(userController.createUser);
router.route('/').get(userController.getAllUser);
router.route('/:id').get(userController.getUserById);
router.route('/phone/:phone').get(userController.getUserByPhoneNumber);
router.route('/:id').put(userController.getUpdateUser);
router.route('/addAddress/:id').post(userController.addUserAddress);
router.route('/addAddress/:userId/:addressId').put(userController.editUserAddress);

module.exports = router;