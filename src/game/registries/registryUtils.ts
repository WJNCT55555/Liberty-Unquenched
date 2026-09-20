export const defineUniqueRegistry = <Definition extends { id: string }>(
  name: string,
  definitions: readonly Definition[],
): Definition[] => {
  const seen = new Set<string>();
  for (const definition of definitions) {
    if (seen.has(definition.id)) throw new Error(`Duplicate ${name} id: ${definition.id}`);
    seen.add(definition.id);
  }
  return [...definitions];
};

/** Merge overlapping catalogs while still rejecting two different definitions for one persisted id. */
export const mergeRegistryDefinitions = <Definition extends { id: string }>(
  name: string,
  definitions: readonly Definition[],
): Definition[] => {
  const byId = new Map<string, Definition>();
  for (const definition of definitions) {
    const existing = byId.get(definition.id);
    if (existing && existing !== definition) throw new Error(`Conflicting ${name} id: ${definition.id}`);
    if (!existing) byId.set(definition.id, definition);
  }
  return [...byId.values()];
};
