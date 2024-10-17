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
router.route('/metadata/:userId').get(userController.getUserMetaDataByUserId);
router.route('/address/:userId').get(userController.getUserAllAddressByUserId);
router.route('/dropdown/createOrder').get(userController.getUserNameDropdownForCreateOrder);
router.route('/address-for-create-order/:userId').get(userController.getUserAllAddressByUserIdForCreateOrder);
router.route('/meta-data-for-create-order/:userId').get(userController.getUserMetaDataForCreateOrder);
router.route('/referr/').post(userController.updateUserReferrInfo);
// router.route('/user11').get(userController.getAllUser);
// router.route('/userListing-for-Add-order/').get(userController.userListingforAddorder);
// router.route('/userlist').get(userController.userListingforAddorder);

module.exports = router;