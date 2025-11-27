const assert = require('assert');

process.env.PORT = '0';
process.env.DISABLE_SCHEDULER = 'true';
const { bootstrap } = require('../src/server');
const rawNewsRepository = require('../src/repositories/rawNewsRepository');

async function setupNews() {
  return rawNewsRepository.create({
    source: 'test',
    title: 'Test headline',
    content: 'Just a test',
    url: 'http://example.com',
    published_at: new Date().toISOString(),
    collected_at: new Date().toISOString(),
    language: 'en',
    symbols_raw: ['TST'],
    hash: `test-${Date.now()}`
  });
}

async function runHealthTest() {
  const { server, intervals } = await bootstrap();
  const port = server.address().port;
  const response = await fetch(`http://localhost:${port}/health`);
  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.strictEqual(json.status, 'ok');
  intervals.forEach((i) => clearInterval(i));
  server.close();
}

async function runNewsApiTest() {
  const news = await setupNews();
  const { server, intervals } = await bootstrap();
  const port = server.address().port;
  const response = await fetch(`http://localhost:${port}/news/${news.id}`);
  assert.strictEqual(response.status, 200);
  const json = await response.json();
  assert.strictEqual(json.raw.id, news.id);
  intervals.forEach((i) => clearInterval(i));
  server.close();
}

(async () => {
  await runHealthTest();
  await runNewsApiTest();
})();
