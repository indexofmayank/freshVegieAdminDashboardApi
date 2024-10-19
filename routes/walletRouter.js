const router = require('express').Router();
const walletController = require('../controllers/walletController');

router.route('/').post(walletController.createWallet);
router.route('/:id').get(walletController.getWalletByUserId);
router.route('/add/:id').post(walletController.addFundsToWallet);
router.route('/use/:id').post(walletController.useWalletfunds);
router.route('/balance/:id').get(walletController.getWalletBalanceByUserId);
router.route('/balance/logs/:id').get(walletController.getWalletBalanceByUserIdForLogs);

module.exports = router;