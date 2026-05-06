const recommendationService = require('../services/recommendationService');

async function getRecommendations(req, res, next) {
  try {
    const userId = req.query.userId || req.params.userId;
    if (!userId) return res.status(400).json({ message: 'userId required as query param or path param' });
    const limit = parseInt(req.query.limit, 10) || 8;

    const result = await recommendationService.getRecommendations(userId, { limit });
    if (result.error) return res.status(404).json({ message: result.error });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendations };
