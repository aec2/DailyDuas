import { insertCustomPrayer, mergePrayers, CustomPrayer, updateCustomPrayer, deleteCustomPrayer, moveCustomPrayer } from './custom-prayer.service';
import { PRAYERS } from './data';

describe('mergePrayers', () => {
  it('inserts custom prayers at their saved positions', () => {
    const customPrayers: CustomPrayer[] = [{
      id: 999,
      arabic: 'custom',
      transliteration: 'Custom',
      virtue: 'Custom virtue',
      targetCount: 5,
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    }];

    const merged = mergePrayers(PRAYERS.slice(0, 2), customPrayers);

    expect(merged[0].id).toBe(999);
    expect(merged[1].id).toBe(PRAYERS[0].id);
  });
});

describe('insertCustomPrayer', () => {
  it('recomputes custom orders from the final merged list', () => {
    const existing: CustomPrayer[] = [{
      id: 991,
      arabic: 'ilk',
      transliteration: 'Ilk',
      virtue: 'Ilk',
      targetCount: 3,
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    }];

    const next = insertCustomPrayer(
      PRAYERS.slice(0, 2),
      existing,
      {
        arabic: 'ikinci',
        transliteration: 'Ikinci',
        virtue: '',
        targetCount: 7,
      },
      3,
    );

    expect(next).toHaveLength(2);
    expect(next[0].order).toBe(1);
    expect(next[1].order).toBe(3);
    expect(next[1].virtue).toContain('Kullanici tarafindan');
  });
});

describe('updateCustomPrayer', () => {
  it('updates content and repositions the custom prayer', () => {
    const existing: CustomPrayer[] = [{
      id: 991,
      arabic: 'ilk',
      transliteration: 'Ilk',
      virtue: 'Ilk',
      targetCount: 3,
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    }];

    const next = updateCustomPrayer(PRAYERS.slice(0, 2), existing, 991, {
      arabic: 'guncel',
      transliteration: 'Guncel',
      virtue: '',
      targetCount: 9,
    }, 3);

    expect(next[0].transliteration).toBe('Guncel');
    expect(next[0].order).toBe(3);
    expect(next[0].targetCount).toBe(9);
  });
});

describe('deleteCustomPrayer', () => {
  it('removes the selected custom prayer', () => {
    const existing: CustomPrayer[] = [{
      id: 991,
      arabic: 'ilk',
      transliteration: 'Ilk',
      virtue: 'Ilk',
      targetCount: 3,
      order: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    }];

    const next = deleteCustomPrayer(PRAYERS.slice(0, 2), existing, 991);

    expect(next).toHaveLength(0);
  });
});

describe('moveCustomPrayer', () => {
  it('moves a custom prayer to a new position in the merged list', () => {
    const existing: CustomPrayer[] = [{
      id: 991,
      arabic: 'ilk',
      transliteration: 'Ilk',
      virtue: 'Ilk',
      targetCount: 3,
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    }];

    const next = moveCustomPrayer(PRAYERS.slice(0, 2), existing, 991, 3);

    expect(next[0].order).toBe(3);
  });
});
