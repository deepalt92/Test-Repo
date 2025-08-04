const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

let cachedStats = null;

// Function to recalculate stats
function recalculateStats(items) {
  return {
    total: items.length,
    averagePrice: items.reduce((acc, cur) => acc + cur.price, 0) / items.length
  };
}

// Initial load and cache
function loadAndCacheStats() {
  fs.readFile(DATA_PATH, (err, raw) => {
    if (err) {
      cachedStats = null;
      return;
    }
    try {
      const items = JSON.parse(raw);
      cachedStats = recalculateStats(items);
    } catch {
      cachedStats = null;
    }
  });
}
loadAndCacheStats();

// Watch for file changes to update cache
fs.watchFile(DATA_PATH, loadAndCacheStats);

// GET /api/stats
router.get('/', (req, res, next) => {
  if (cachedStats) {
    res.json(cachedStats);
  } else {
    // Fallback: recalculate if cache is missing
    fs.readFile(DATA_PATH, (err, raw) => {
      if (err) return next(err);
      try {
        const items = JSON.parse(raw);
        const stats = recalculateStats(items);
        cachedStats = stats;
        res.json(stats);
      } catch (e) {
        next(e);
      }
    });
  }
});

module.exports = router;