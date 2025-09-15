
import express from 'express';
const router = express.Router();

router.get('/check-env', (req, res) => {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const braveKey = process.env.BRAVE_API_KEY;

  const status = {
    mistralKeyLoaded: !!mistralKey,
    braveKeyLoaded: !!braveKey,
    timestamp: new Date().toISOString()
  };

  if (mistralKey && braveKey) {
    res.json({
      message: 'SUCCESS: API keys are loaded correctly.',
      status
    });
  } else {
    res.status(500).json({
      message: 'FAILURE: One or more API keys are missing from the environment.',
      status
    });
  }
});

export default router;
