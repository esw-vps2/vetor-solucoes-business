import { describe, expect, it } from 'vitest';
import {
  buildUserProviderContent,
  selectProviderModel,
} from './ai-provider-content.js';

describe('selectProviderModel', () => {
  const imageMessage = {
    content: [
      {
        image_url: { url: 'data:image/png;base64,abc' },
        type: 'image_url' as const,
      },
    ],
    role: 'user' as const,
  };

  it('keeps the text model when the turn has no image', () => {
    expect(
      selectProviderModel(
        [{ content: 'hello', role: 'user' }],
        'text-model',
        'vision-model',
      ),
    ).toBe('text-model');
  });

  it('uses the vision model when a message includes an image', () => {
    expect(
      selectProviderModel([imageMessage], 'text-model', 'vision-model'),
    ).toBe('vision-model');
  });
});

describe('buildUserProviderContent', () => {
  it('returns plain text when there are no attachments', () => {
    expect(buildUserProviderContent('hello', [])).toBe('hello');
  });

  it('embeds image attachments for the provider', () => {
    const content = buildUserProviderContent('see this', [
      {
        bytes: Buffer.from('abc'),
        mimeType: 'image/png',
        originalName: 'chart.png',
      },
    ]);

    expect(Array.isArray(content)).toBe(true);
    expect(content).toEqual([
      { text: 'see this', type: 'text' },
      {
        image_url: { url: `data:image/png;base64,${Buffer.from('abc').toString('base64')}` },
        type: 'image_url',
      },
    ]);
  });
});
