const router = require('express').Router();

const userController = require('../controllers/userController');

//create user
router.route('/').post(userController.createUser);
router.route('/').get(userController.getAllUser);
router.route('/:id').get(userController.getUserById);
router.route('/phone/:phone').get(userController.getUserByPhoneNumber);
router.route('/:id').put(userController.updateUser);
router.route('/addAddress/:id').post(userController.addUserAddress);
router.route('/updateAddress/:userId/:addressId').put(userController.editUserAddress);
router.route('/delete/:userId/:addressId').delete(userController.deleteAddress);
router.route('/transactions/:userId').get(userController.getUserTranscationByUserId);

module.exports = router;