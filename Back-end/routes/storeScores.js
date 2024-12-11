const express = require('express');
const { handleStoreScores } = require('../controllers/storeScores');

const router = express.Router();

router.post('/', handleStoreScores);

module.exports = router;