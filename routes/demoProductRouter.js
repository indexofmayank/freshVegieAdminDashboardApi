const router = require('express').Router();
const demoProductController = require('../controllers/demoProductController');

router.route('/').post(demoProductController.updateLoadProductCSV);

module.exports = router;