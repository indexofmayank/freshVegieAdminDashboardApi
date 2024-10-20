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

module.exports = router;