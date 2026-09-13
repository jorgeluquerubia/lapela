import assert from 'node:assert/strict';
import test from 'node:test';
import {duplicateMigrationVersions} from './migration-versions.mjs';

test('detecta dos migraciones ejecutables con la misma versión', () => {
  assert.deepEqual(
    duplicateMigrationVersions([
      '202609110001_product_search.sql',
      '202609110001_public_profiles_reviews.sql',
    ]),
    [{
      version: '202609110001',
      files: [
        '202609110001_product_search.sql',
        '202609110001_public_profiles_reviews.sql',
      ],
    }],
  );
});

test('ignora documentos históricos y acepta versiones únicas', () => {
  assert.deepEqual(
    duplicateMigrationVersions([
      'README.md',
      '202609110001_product_search.sql',
      '202609130001_public_profiles_reviews.sql',
    ]),
    [],
  );
});
