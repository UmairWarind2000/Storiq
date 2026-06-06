// packages/shared/queues/index.js
const Bull  = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,        // 5s → 10s → 20s
  },
  removeOnComplete: 100,  // keep last 100 completed jobs for Bull Board
  removeOnFail: 200,      // keep last 200 failed jobs for debugging
};

function makeQueue(name) {
  const queue = new Bull(name, {
    redis: REDIS_URL,
    defaultJobOptions,
    settings: {
      stalledInterval:    30000,  // check for stalled jobs every 30s
      maxStalledCount:    2,      // mark as failed after stalling twice
      lockDuration:       30000,  // job lock expires after 30s
    },
  });

  // Attach standard event listeners for observability
  queue.on('error',     (err)       => console.error(`[${name}] Queue error:`, err.message));
  queue.on('waiting',   (jobId)     => console.log(`[${name}] Job ${jobId} waiting`));
  queue.on('active',    (job)       => console.log(`[${name}] Job ${job.id} started`));
  queue.on('stalled',   (job)       => console.warn(`[${name}] Job ${job.id} stalled`));
  queue.on('completed', (job)       => console.log(`[${name}] Job ${job.id} completed`));
  queue.on('failed',    (job, err)  => console.error(`[${name}] Job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message));

  return queue;
}

const queues = {
  analytics: makeQueue('analytics'),
  campaign:  makeQueue('campaign'),
  email:     makeQueue('email'),
  webhook:   makeQueue('webhook'),
};

// Health check helper — used by GET /health
async function getQueuesHealth() {
  const health = {};
  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
    ]);
    health[name] = { waiting, active, failed };
  }
  return health;
}

module.exports = { queues, getQueuesHealth };