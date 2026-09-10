import { createClient } from 'redis';

const publisher = createClient({
  url: 'redis://localhost:6379',
});

publisher.on('error', (err) => {
  console.log('publisher error', err);
});

await publisher.connect();

export const CHANNEL = 'leaderBoard:update';

export async function publisherScoreUpdate(data: Record<string, unknown>) {
  await publisher.publish(CHANNEL, JSON.stringify(data));
}
