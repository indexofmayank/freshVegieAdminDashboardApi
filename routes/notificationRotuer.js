const router = require('express').Router();
const notificationController = require('../controllers/notificatinController');

router.route('/').get(notificationController.getAllNotificationForTable);
router.route('/:notificationId').get(notificationController.getNotificationById);
router.route('/').post(notificationController.createNoficiation);
router.route('/:notificationId').put(notificationController.updateNotificationById);
router.route('/:notificationId').delete(notificationController.deleteNotificationById);
router.route('/products/name').get(notificationController.getAllProductForNotification);
router.route('/category/name').get(notificationController.getAllCategoryForNotification);
router.route('/user/fcmtoken').get(notificationController.getAllUserForNotification);
router.route('/fcmtokens/').post(notificationController.getUserFcmTokenByUserId);
router.route('/user/name').get(notificationController.getUserNamesForNotification);
router.route('/send/:id').get(notificationController.pushNotification);

module.exports = router;