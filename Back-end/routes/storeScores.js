const express = require('express');
const { handleStoreScores } = require('../controllers/storeScores');
const { validateRequest, storeScoresSchema } = require('../middleware/requestValidation');

const router = express.Router();

router.post('/', validateRequest(storeScoresSchema, 'body'), handleStoreScores);

module.exports = router;