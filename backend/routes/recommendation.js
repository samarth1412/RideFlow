const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// GET /api/recommendations?userId=xxxx&limit=5
router.get('/', recommendationController.getRecommendations);

// Optional: allow path param /api/recommendations/:userId
router.get('/:userId', recommendationController.getRecommendations);

module.exports = router;
