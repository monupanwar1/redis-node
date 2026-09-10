import { createClient } from 'redis';
import { CHANNEL } from './publisher';

const subscriber = createClient({
  url: 'redis://localhost:6379',
});

subscriber.on('error', (err) => {
  console.log('Subscriber error', err);
});

subscriber.connect();

await subscriber.subscribe(CHANNEL, (message) => {
  const data = JSON.parse(message);
  console.log('Leaderboard event:');
  console.log(data);
});
