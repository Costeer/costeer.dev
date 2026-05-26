import { describe, expect, test } from 'bun:test';
import { buildAlertHtml, parseAlertBlock } from './remark-alert';

describe('remark alert parser', () => {
  test('keeps known type, style, and direction values', () => {
    expect(
      parseAlertBlock('type: warning\nstyle: outline\ndirection: responsive\ntitle: Heads up'),
    ).toMatchObject({
      type: 'warning',
      style: 'outline',
      direction: 'responsive',
      title: 'Heads up',
    });
  });

  test('drops unknown variants and unsafe custom classes', () => {
    expect(
      parseAlertBlock('type: loud\nstyle: weird\ndirection: sideways\nclass: ok bad;alert(1)'),
    ).toEqual({
      class: 'ok',
      description: undefined,
      direction: undefined,
      icon: undefined,
      style: undefined,
      title: undefined,
      type: undefined,
    });
  });

  test('uses unkeyed lines as description', () => {
    expect(parseAlertBlock('Remember this\nsecond line').description).toBe(
      'Remember this\nsecond line',
    );
  });

  test('buildAlertHtml escapes content and known classes', () => {
    const html = buildAlertHtml({
      type: 'info',
      title: '<Title>',
      description: 'A & B',
      icon: 'none',
    });
    expect(html).toContain('alert-info');
    expect(html).toContain('&lt;Title&gt;');
    expect(html).toContain('A &amp; B');
  });
});
