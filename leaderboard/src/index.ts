import express from 'express';
import { createClient } from 'redis';
import { publisherScoreUpdate } from './publisher';

const app = express();

app.use(express.json());

const redis = createClient({
  url: 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.log('Redis error', err);
});

await redis.connect();

const PORT = 3000;
const LEADERBOARD_KEY = 'leaderboard';

app.post('/leader/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (typeof score != 'number') {
      return res.status(400).json({
        message: 'score must be number',
      });
    }

    const existingPlayer = await redis.zScore(LEADERBOARD_KEY, id);

    if (existingPlayer != null) {
      return res.status(409).json({
        message: 'Player already exists',
      });
    }

    await redis.zAdd(LEADERBOARD_KEY, {
      score,
      value: id,
    });
    //  ----------------------------
    await publisherScoreUpdate({
      type: 'PLAYER_CREATED',
      playerId: id,
      score,
    });

    return res.status(201).json({
      playerId: id,
      score,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});

app.put('/leader/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (typeof score != 'number') {
      return res.status(400).json({
        message: 'score must be number',
      });
    }

    const existingPlayer = await redis.zScore(LEADERBOARD_KEY, id);

    if (existingPlayer === null) {
      return res.status(409).json({
        message: 'Player not found',
      });
    }

    const newScore = await redis.zIncrBy(LEADERBOARD_KEY, score, id);
    //  ----------------------------
    await publisherScoreUpdate({
      type: 'SCORE_UPDATED',
      playerId: id,
      increment: score,
      score: newScore,
    });

    return res.status(201).json({
      playerId: id,
      score: newScore,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});

app.get('/leader/top10', async (_req, res) => {
  try {
    const players = await redis.zRangeWithScores(LEADERBOARD_KEY, 0, 9, {
      REV: true,
    });

    return res.json(players);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});
app.get('/leader/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const score = await redis.zScore(LEADERBOARD_KEY, id);

    if (score === null) {
      return res.status(404).json({
        message: 'Player not found',
      });
    }

    const rank = await redis.zRevRank(LEADERBOARD_KEY, id);
    if (rank === null) {
      return res.status(404).json({
        message: 'Player not found',
      });
    }
    return res.json({
      playerId: id,
      score,
      rank: rank + 1,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});
