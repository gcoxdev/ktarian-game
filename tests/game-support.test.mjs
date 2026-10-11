import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline, disposeGameObject, seededRandom } from '../game-support.mjs';

test('pausing preserves delayed work and its remaining duration', () => {
  const clock = createTimeline();
  const calls = [];
  clock.schedule(() => calls.push('spawn'), 1000);
  clock.advance(.4);
  for (let i = 0; i < 120; i++) clock.advance(0);
  assert.equal(clock.elapsedTime, .4);
  assert.deepEqual(calls, []);
  clock.advance(.61);
  assert.deepEqual(calls, ['spawn']);
});

test('restarting invalidates completion and game-over callbacks, including an active batch', () => {
  const clock = createTimeline();
  const calls = [];
  clock.schedule(() => {
    clock.clear();
    clock.schedule(() => calls.push('new game'), 100);
  }, 100);
  clock.schedule(() => calls.push('old level complete'), 200);
  clock.schedule(() => calls.push('old game over'), 300);
  clock.advance(1);
  assert.deepEqual(calls, []);
  clock.advance(.11);
  assert.deepEqual(calls, ['new game']);
});

test('cancellation leaves unrelated game callbacks intact', () => {
  const clock = createTimeline();
  let calls = 0;
  const id = clock.schedule(() => { calls += 10; }, 100);
  clock.schedule(() => { calls++; }, 100);
  clock.cancel(id);
  clock.advance(.2);
  clock.advance(.2);
  assert.equal(calls, 1);
});

test('removed groups dispose shared geometry and material once', () => {
  let removed = 0, geometries = 0, materials = 0;
  const geometry = { dispose() { geometries++; } };
  const material = { dispose() { materials++; } };
  const group = {
    removeFromParent() { removed++; },
    traverse(visit) {
      visit({ geometry, material });
      visit({ geometry, material: [material] });
      visit({});
    }
  };
  disposeGameObject(group);
  disposeGameObject(group);
  assert.deepEqual({ removed, geometries, materials }, { removed: 1, geometries: 1, materials: 1 });
});

test('preview seeds reproduce variations independently of other random calls', () => {
  const sample = seed => Array.from({ length: 30 }, seededRandom(seed));
  assert.deepEqual(sample(47), sample(47));
  assert.notDeepEqual(sample(47), sample(48));
  assert.ok(sample(0).every(value => value >= 0 && value < 1));
});
