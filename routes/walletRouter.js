const router = require('express').Router();
const walletController = require('../controllers/walletController');

router.route('/').post(walletController.createWallet);
router.route('/:id').get(walletController.getWalletByUserId);
router.route('/add/:id').post(walletController.addFundsToWallet);
router.route('/use/:id').post(walletController.useWalletfunds);

module.exports = router;