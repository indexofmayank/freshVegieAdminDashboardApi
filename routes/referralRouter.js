const router = require('express').Router();

const referralController = require('../controllers/referralController');

router.route('/:id').get(referralController.getReferralInfoByUserId);
router.route('/code/:id').get(referralController.getReferralCodeByUserId);
router.route('/update/:id/:referredId').put(referralController.updateReferralInfoForReferred);
router.route('/updatereward/:id').post(referralController.updateReferralAmount);

module.exports = router;