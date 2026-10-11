import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { coneParameterRules, validateConeConfig } from '../cone-config.mjs';

const config = JSON.parse(await readFile(new URL('../cone-types.json', import.meta.url)));
const schema = JSON.parse(await readFile(new URL('../cone-types.schema.json', import.meta.url)));
const first = config.coneTypes[0];

test('all authored cone profiles validate with expected units', () => {
  const result = validateConeConfig(config);
  assert.equal(result.profiles.length, 10);
  assert.deepEqual(result.errors, []);
  assert.equal(result.profiles[0].s1r, .05);
  assert.equal(result.profiles[0].s3er, 1.1);
  assert.equal(result.profiles[0].orY, -20);
  assert.equal(result.profiles[0].orB, true);
});

test('bad entries do not discard valid siblings', () => {
  const { profiles, errors } = validateConeConfig({ coneTypes: [null, first, { ...first, name: 'Invalid', OC: '20' }] });
  assert.equal(profiles.length, 1);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /expected an object/);
  assert.match(errors[1], /OC/);
});

test('invalid values and incompatible landmarks cannot reach geometry generation', () => {
  for (const patch of [
    { BA: NaN }, { 'S3-ER': Infinity }, { 'OR-B': 'false' },
    { 'S2-H': 30 }, { 'S2-H': 60.5 }, { BH: 90 }, { 'S3-ER': 0 }, { typo: 10 }, { name: ' ' }
  ]) {
    assert.throws(() => validateConeConfig({ coneTypes: [{ ...first, ...patch }] }), /No valid cone profiles/);
  }
  const missing = { ...first };
  delete missing['S2-R'];
  assert.throws(() => validateConeConfig({ coneTypes: [missing] }), /S2-R/);
});

test('empty configurations and unsupported versions are explicit errors', () => {
  for (const input of [null, [], {}, { coneTypes: [] }, { schemaVersion: 2, coneTypes: [first] }]) {
    assert.throws(() => validateConeConfig(input));
  }
});

test('duplicate names are reported and excluded', () => {
  const result = validateConeConfig({ coneTypes: [first, { ...first, name: ` ${first.name} ` }] });
  assert.equal(result.profiles.length, 1);
  assert.match(result.errors[0], /duplicate name/);
});

test('editor schema and runtime ranges agree', () => {
  for (const [key, [min, max]] of Object.entries(coneParameterRules)) {
    assert.equal(schema.properties.coneTypes.items.properties[key].minimum, min, key);
    assert.equal(schema.properties.coneTypes.items.properties[key].maximum, max, key);
  }
});
