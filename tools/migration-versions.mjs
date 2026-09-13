export function duplicateMigrationVersions(fileNames) {
  const versions = new Map();
  const duplicates = [];

  for (const fileName of fileNames.filter((name) => /^\d+_.+\.sql$/.test(name)).sort()) {
    const version = fileName.split('_', 1)[0];
    const previous = versions.get(version);
    if (previous) duplicates.push({version, files: [previous, fileName]});
    else versions.set(version, fileName);
  }

  return duplicates;
}
