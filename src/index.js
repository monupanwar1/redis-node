import { createClient } from 'redis';

// connection string

const redis = createClient({
  url: 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.log('Redis client Error:', err);
});

// connect
await redis.connect();

console.log('Redis connected');

// set
const user = {
  name: 'kunalPanwar',
  email: 'kunal@redis.com',
  password: 'seuperSecret',
};

await redis.set('user:1', JSON.stringify(user));

// get
const data = await redis.get('user:1');

const userFromRedis = JSON.parse(data);

console.log(userFromRedis);

await redis.close();
