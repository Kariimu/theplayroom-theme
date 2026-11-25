import { describe, it, expect } from 'vitest';
import { cleanWhatsappNumber, whatsappEnquiryHref } from '../../app/lib/whatsapp';

describe('cleanWhatsappNumber', () => {
  it('keeps digits only', () => {
    expect(cleanWhatsappNumber('+966 53 260 3300')).toBe('966532603300');
    expect(cleanWhatsappNumber(966532603300)).toBe('966532603300');
  });
  it('is empty for nothing usable', () => {
    for (const v of [null, undefined, '', '+', '  ']) expect(cleanWhatsappNumber(v)).toBe('');
  });
  it("is empty for the manifest's unset default 0 and other too-short numbers", () => {
    for (const v of [0, '0', 1234567, '+966 5']) expect(cleanWhatsappNumber(v)).toBe('');
    expect(whatsappEnquiryHref(0, 'hi')).toBe('');
  });
});

describe('whatsappEnquiryHref', () => {
  it('builds a wa.me link with the URL-encoded enquiry text', () => {
    const href = whatsappEnquiryHref('966532603300', 'مرحباً، أريد الاستفسار عن المنتج: ', 'سلم سويدي');
    expect(href.startsWith('https://wa.me/966532603300?text=')).toBe(true);
    expect(decodeURIComponent(href.split('text=')[1])).toBe('مرحباً، أريد الاستفسار عن المنتج: سلم سويدي');
  });

  it('omits the query when there is no message or subject', () => {
    expect(whatsappEnquiryHref('966532603300')).toBe('https://wa.me/966532603300');
  });

  it('is empty when the number is unusable', () => {
    expect(whatsappEnquiryHref('', 'hi', 'x')).toBe('');
    expect(whatsappEnquiryHref(null)).toBe('');
  });
});
