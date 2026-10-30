import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Category } from '../../../../src/domain/entities/category.js';
import { Table } from '../../../../src/domain/entities/table.js';
import { DomainError } from '../../../../src/domain/errors/domain-error.js';
import { CategoryName } from '../../../../src/domain/value-objects/category/category-name.js';
import { CategorySortOrder } from '../../../../src/domain/value-objects/category/category-sort-order.js';
import { DecimalValue } from '../../../../src/domain/value-objects/shared/decimal-value.js';
import { TableNumber } from '../../../../src/domain/value-objects/table/table-number.js';
import { TableStatus } from '../../../../src/domain/value-objects/table/table-status.js';

describe('Table', () => {
  it('starts free with zero spent and needs an ID after persistence', () => {
    const table = Table.create(TableNumber.create(12));

    assert.equal(table.getNumber(), 12);
    assert.equal(table.getStatus(), 'FREE');
    assert.equal(table.getTotalSpent(), '0');
    assert.throws(() => table.getId(), (error: unknown) =>
      error instanceof DomainError && error.field === 'id' && error.code === 'REQUIRED');
  });

  it('reconstitutes an occupied table with its current total', () => {
    const table = Table.create(TableNumber.create(3), TableStatus.create('OCCUPIED'), DecimalValue.create('30.50'), 'table-1');

    assert.equal(table.getId(), 'table-1');
    assert.equal(table.getStatus(), 'OCCUPIED');
    assert.equal(table.getTotalSpent(), '30.5');
  });
});

describe('Category', () => {
  it('requires an ID only after it has been saved', () => {
    const unsaved = Category.create(CategoryName.create('Pastéis'));
    assert.equal(unsaved.getName(), 'Pastéis');
    assert.throws(() => unsaved.getId(), (error: unknown) =>
      error instanceof DomainError && error.field === 'id' && error.code === 'REQUIRED');
    assert.throws(() => unsaved.getRequiredSortOrder(), (error: unknown) =>
      error instanceof DomainError && error.field === 'sortOrder' && error.code === 'REQUIRED');

    const saved = Category.create(CategoryName.create('Pastéis'), CategorySortOrder.create(2), 'category-1');
    assert.equal(saved.getId(), 'category-1');
    assert.equal(saved.getSortOrder(), 2);
    assert.equal(saved.getRequiredSortOrder(), 2);
  });
});
