// A simulation clock owns gameplay callbacks. Advancing by zero pauses both
// animation time and pending work; clearing it invalidates a previous game.
export function createTimeline() {
  let serial = 0;
  const pending = new Map();
  return {
    elapsedTime: 0,
    schedule(callback, milliseconds) {
      const id = ++serial;
      pending.set(id, { at: this.elapsedTime + milliseconds / 1000, callback });
      return id;
    },
    cancel(id) { pending.delete(id); },
    clear() { pending.clear(); },
    advance(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      this.elapsedTime += seconds;
      const due = [...pending].sort((a, b) => a[1].at - b[1].at);
      for (const [id, job] of due) {
        if (job.at > this.elapsedTime) break;
        if (!pending.delete(id)) continue;
        job.callback();
      }
    }
  };
}

// Cone and disc resources are owned by each group. Some disc meshes share the
// same geometry/material, so dispose each resource only once per group.
const disposedObjects = new WeakSet();
export function disposeGameObject(object) {
  if (!object || disposedObjects.has(object)) return;
  disposedObjects.add(object);
  object.removeFromParent();
  const geometries = new Set();
  const materials = new Set();
  object.traverse(child => {
    if (child.geometry) geometries.add(child.geometry);
    const list = Array.isArray(child.material) ? child.material : [child.material];
    list.filter(Boolean).forEach(material => materials.add(material));
    child.shadow?.dispose();
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

export function seededRandom(seed) {
  let value = Number(seed) >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let sample = Math.imul(value ^ value >>> 15, value | 1);
    sample ^= sample + Math.imul(sample ^ sample >>> 7, sample | 61);
    return ((sample ^ sample >>> 14) >>> 0) / 4294967296;
  };
}
