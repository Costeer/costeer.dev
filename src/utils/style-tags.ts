import type { Post } from './posts';

export type StyleTagSlug =
  | 'argument'
  | 'field-note'
  | 'technical'
  | 'personal'
  | 'political'
  | 'opinion';

export type StyleTagDefinition = {
  slug: StyleTagSlug;
  label: string;
  className: string;
  hue: number;
  description: string;
  headingFont?: string;
};

export type StyleGradient = {
  angle: number;
  stop: number;
  driftX: number;
  driftY: number;
};

export type PostStyle = {
  definition: StyleTagDefinition | undefined;
  tag: string | undefined;
  className: string;
  gradient: StyleGradient;
};

export const STYLE_TAGS = {
  argument: {
    slug: 'argument',
    label: 'Argument',
    className: 'post-style-argument',
    hue: 36,
    description: 'Direct, structured, civic writing.',
  },
  'field-note': {
    slug: 'field-note',
    label: 'Field note',
    className: 'post-style-field-note',
    hue: 112,
    description: 'Observed, provisional notes close to the ground.',
  },
  technical: {
    slug: 'technical',
    label: 'Technical',
    className: 'post-style-technical',
    hue: 224,
    description: 'Practical writing, testable details, code-aware structure.',
    headingFont: 'var(--font-lexend, var(--font-sans))',
  },
  personal: {
    slug: 'personal',
    label: 'Personal',
    className: 'post-style-personal',
    hue: 314,
    description: 'Reflective writing with less system voice.',
  },
  political: {
    slug: 'political',
    label: 'Political',
    className: 'post-style-political',
    hue: 31,
    description: 'Public notice, union leaflet, civic argument.',
    headingFont: 'var(--font-lato, var(--font-sans))',
  },
  opinion: {
    slug: 'opinion',
    label: 'Opinion',
    className: 'post-style-opinion',
    hue: 305,
    description: 'Signed margin note, direct stance, personal judgment.',
    headingFont: 'var(--font-lato, var(--font-sans))',
  },
} satisfies Record<StyleTagSlug, StyleTagDefinition>;

const DEFAULT_GRADIENT: StyleGradient = {
  angle: 90,
  stop: 64,
  driftX: 12,
  driftY: 16,
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function numberInRange(hash: number, shift: number, min: number, max: number): number {
  const byte = (hash >>> shift) & 0xff;
  return Math.round(min + (byte / 255) * (max - min));
}

export function normalizeStyleTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function isStyleTag(tag: string): tag is StyleTagSlug {
  return normalizeStyleTag(tag) in STYLE_TAGS;
}

export function getStyleTag(post: Post): StyleTagDefinition | undefined {
  for (const tag of post.data.tags) {
    const key = normalizeStyleTag(tag);
    if (key in STYLE_TAGS) return STYLE_TAGS[key as StyleTagSlug];
  }
  return undefined;
}

export function orderedTags(post: Post): string[] {
  const style = getStyleTag(post);
  if (!style) return post.data.tags;

  const firstStyleTag = post.data.tags.find((tag) => normalizeStyleTag(tag) === style.slug);
  const rest = post.data.tags.filter((tag) => normalizeStyleTag(tag) !== style.slug);
  return firstStyleTag ? [firstStyleTag, ...rest] : post.data.tags;
}

export function styleGradientForPost(post: Post): StyleGradient {
  const style = getStyleTag(post);
  if (!style) return DEFAULT_GRADIENT;

  const hash = stableHash(`${style.slug}:${post.id}`);
  return {
    angle: numberInRange(hash, 0, 78, 108),
    stop: numberInRange(hash, 8, 56, 76),
    driftX: numberInRange(hash, 16, 0, 28),
    driftY: numberInRange(hash, 24, 0, 36),
  };
}

export function getPostStyle(post: Post): PostStyle {
  const definition = getStyleTag(post);
  return {
    definition,
    tag: definition?.slug,
    className: definition?.className ?? 'post-style-default',
    gradient: styleGradientForPost(post),
  };
}

export function styleProperties(postStyle: PostStyle): string {
  const hue = postStyle.definition?.hue ?? 305;
  const { angle, stop, driftX, driftY } = postStyle.gradient;
  const properties = [
    `--style-hue: ${hue}`,
    `--style-gradient-angle: ${angle}deg`,
    `--style-gradient-stop: ${stop}%`,
    `--style-gradient-drift: ${driftX}% ${driftY}%`,
  ];

  if (postStyle.definition?.headingFont) {
    properties.push(`--style-heading-font: ${postStyle.definition.headingFont}`);
  }

  return properties.join('; ');
}
