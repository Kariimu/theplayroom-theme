import { describe, it, expect } from 'vitest';
import {
  fieldLinkUrl,
  groupProductInfo,
  hasDescriptionContent,
  isUnlabeledField,
} from '../../app/lib/productInfo';

const names = (groups: { name: string }[]) => groups.map((group) => group.name);

describe('groupProductInfo', () => {
  it('sorts the seven store groups and the facts group into the four sections', () => {
    const field = [{ name: '.', value: 'x' }];
    const groups = groupProductInfo([
      { name: 'ملاحظة', fields: field },
      { name: 'آلية الإسترجاع و الإستبدال', fields: field },
      { name: 'تفاصيل الشحن', fields: field },
      { name: 'خدمة التركيب', fields: field },
      { name: 'دليل التركيب', fields: [{ name: 'الدليل', type: 'file', value: 'https://cdn/x.pdf' }] },
      { name: 'إستخدامات المنتج', fields: field },
      { name: 'مميزات المنتج', fields: field },
      { name: 'تفاصيل المنتج', fields: [{ name: 'الخامة', value: 'خشب' }] },
    ]);

    expect(names(groups.details)).toEqual(['مميزات المنتج', 'إستخدامات المنتج']);
    expect(names(groups.specs)).toEqual(['تفاصيل المنتج', 'ملاحظة']);
    expect(groups.specs[0].isFacts).toBe(true);
    expect(names(groups.assembly)).toEqual(['دليل التركيب', 'خدمة التركيب']);
    expect(names(groups.shipping)).toEqual(['تفاصيل الشحن', 'آلية الإسترجاع و الإستبدال']);
  });

  it('matches the English group names too', () => {
    const groups = groupProductInfo([
      { name: 'Shipping Details', fields: [{ name: '.', value: '3-5 days' }] },
      { name: 'Product Features', fields: [{ name: '.', value: 'Solid wood' }] },
    ]);
    expect(names(groups.shipping)).toEqual(['Shipping Details']);
    expect(names(groups.details)).toEqual(['Product Features']);
  });

  it('puts an unknown group under Specifications, after the known ones, in the merchant order', () => {
    const groups = groupProductInfo([
      { name: 'Colours', fields: [{ name: 'Colour', value: 'Red' }] },
      { name: 'Care', fields: [{ name: 'Clean', value: 'Damp cloth' }] },
      { name: 'Note', fields: [{ name: '.', value: 'Adult supervision' }] },
    ]);
    expect(names(groups.specs)).toEqual(['Note', 'Colours', 'Care']);
  });

  it('drops empty fields, and a group left with none', () => {
    const groups = groupProductInfo([
      { name: 'Note', fields: [{ name: '.', value: '   ' }] },
      { name: 'Shipping Details', fields: [{ name: 'Time', value: '' }, { name: 'Cost', value: 'Free' }] },
    ]);
    expect(groups.specs).toEqual([]);
    expect(groups.shipping[0].fields).toEqual([{ name: 'Cost', value: 'Free' }]);
  });

  it('is four empty sections with no data', () => {
    expect(groupProductInfo(undefined)).toEqual({ details: [], specs: [], assembly: [], shipping: [] });
  });
});

describe('hasDescriptionContent', () => {
  it('is false for an empty editor paragraph', () => {
    expect(hasDescriptionContent('<p>&nbsp;</p>')).toBe(false);
    expect(hasDescriptionContent('<p> </p><br>')).toBe(false);
    expect(hasDescriptionContent(undefined)).toBe(false);
  });

  it('is true for text, an image or a video embed', () => {
    expect(hasDescriptionContent('<p>Solid wood</p>')).toBe(true);
    expect(hasDescriptionContent('<p><img src="a.jpg"></p>')).toBe(true);
    expect(hasDescriptionContent('<iframe src="https://youtube.com/embed/x"></iframe>')).toBe(true);
  });
});

describe('isUnlabeledField', () => {
  it('treats a "." or blank name as no label', () => {
    expect(isUnlabeledField({ name: '.' })).toBe(true);
    expect(isUnlabeledField({ name: ' ' })).toBe(true);
    expect(isUnlabeledField({})).toBe(true);
    expect(isUnlabeledField({ name: 'الخامة' })).toBe(false);
  });
});

describe('fieldLinkUrl', () => {
  it('links an http(s) value and nothing else', () => {
    expect(fieldLinkUrl({ type: 'file', value: 'https://cdn.salla.sa/x.pdf' })).toBe('https://cdn.salla.sa/x.pdf');
    expect(fieldLinkUrl({ value: 'javascript:alert(1)' })).toBeUndefined();
    expect(fieldLinkUrl({ value: 'Free shipping over 500' })).toBeUndefined();
  });
});
