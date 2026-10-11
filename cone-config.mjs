export const coneParameterRules = {
  'S1-R': [1, 150], 'S1-H': [0, 96],
  'S2-R': [1, 150], 'S2-H': [1, 99],
  'S3-R': [1, 150], 'S3-ER': [.1, 4],
  OC: [0, 100], OR: [0, 90], 'OR-Y': [-90, 90],
  BH: [0, 95], BA: [0, 90], BO: [-180, 180]
};

export function normalizeConeShapeProfile(source) {
  return {
    name: source.name.trim(),
    s1r: source['S1-R'] / 100, s1h: source['S1-H'] / 100,
    s2r: source['S2-R'] / 100, s2h: source['S2-H'] / 100,
    s3r: source['S3-R'] / 100, s3er: source['S3-ER'],
    oc: source.OC / 100, or: source.OR, orY: source['OR-Y'],
    bh: source.BH / 100, ba: source.BA, bo: source.BO, orB: source['OR-B']
  };
}

export function validateConeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Configuration must be an object.');
  }
  if (config.schemaVersion !== undefined && config.schemaVersion !== 1) {
    throw new Error('Unsupported schemaVersion; expected 1.');
  }
  if (!Array.isArray(config.coneTypes) || config.coneTypes.length === 0) {
    throw new Error('coneTypes must be a non-empty array.');
  }
  const profiles = [];
  const errors = [];
  const names = new Set();
  const keys = new Set(['name', 'OR-B', ...Object.keys(coneParameterRules)]);
  config.coneTypes.forEach((source, index) => {
    const issues = [];
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      errors.push(`Cone ${index + 1}: expected an object.`);
      return;
    }
    const name = typeof source.name === 'string' ? source.name.trim() : '';
    if (!name) issues.push('name must be a non-empty string');
    else if (names.has(name)) issues.push(`duplicate name "${name}"`);
    Object.keys(source).forEach(key => {
      if (!keys.has(key)) issues.push(`unknown parameter ${key}`);
    });
    for (const [key, [min, max]] of Object.entries(coneParameterRules)) {
      const value = source[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        issues.push(`${key} must be a number from ${min} to ${max}`);
      }
    }
    if (typeof source['OR-B'] !== 'boolean') issues.push('OR-B must be true or false');
    if (source['S2-H'] < source['S1-H'] + 1) issues.push('S2-H must be at least 1 percentage point above S1-H');
    if (source.BA > 0 && source.BH > source['S2-H'] - 2) {
      issues.push('BH must be at least 2 percentage points below S2-H when BA is positive');
    }
    if (issues.length) errors.push(`Cone ${index + 1}${name ? ` (${name})` : ''}: ${issues.join('; ')}.`);
    else {
      names.add(name);
      profiles.push(normalizeConeShapeProfile(source));
    }
  });
  if (!profiles.length) throw new Error(`No valid cone profiles. ${errors.join(' ')}`);
  return { profiles, errors };
}
