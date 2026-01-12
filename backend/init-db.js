import { initializeDatabase } from './src/utils/init-db.js';

console.log('Initializing database...');
initializeDatabase().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
