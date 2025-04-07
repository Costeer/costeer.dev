import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Costeer.dev",
  EMAIL: "costeer@protonmail.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 0,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "~/home",
  DESCRIPTION: "my corner of the internet.",
};

export const BLOG: Metadata = {
  TITLE: "~/notes",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects, with links to repositories and demos.",
};

export const LINKS: Metadata = {
  TITLE: "Links",
  DESCRIPTION:
    "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
  {
    NAME: "links",
    HREF: "links",
  },
  {
    NAME: "github",
    HREF: "https://github.com/markhorn-dev",
  },
];
