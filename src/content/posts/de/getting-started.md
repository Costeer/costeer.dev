---
title: 'Erste Schritte'
description: 'Dein erster Beitrag mit Chirping Astro. Lerne, wie du die Seite konfigurierst, Beiträge schreibst und veröffentlichst.'
pubDate: 2026-05-03
tags: [erste-schritte, tutorial]
categories: [Anleitung]
translationKey: getting-started
pinned: true
toc: true
---

Willkommen auf deinem neuen Blog! Dieser Beispielbeitrag zeigt dir die Grundlagen von **Chirping Astro**.

## Seite konfigurieren

Öffne `src/config.ts` und passe diese Werte an:

- **title** — Name deiner Website oder deines Blogs
- **description** — Beschreibung für Suchmaschinen und RSS
- **author.name** — Name in Seitenleiste und Footer
- **url** — deine Produktions-URL, am besten über die Umgebungsvariable `SITE_URL`

## Umgebungsvariablen

Kopiere `.env.example` nach `.env`:

```bash
cp .env.example .env
```

Wichtige Variablen:

| Variable               | Zweck                                                       |
| ---------------------- | ----------------------------------------------------------- |
| `SITE_URL`             | Produktions-URL, z. B. `https://meinblog.de`                |
| `BASE_PATH`            | `/<repo-name>` für GitHub Pages, sonst leer                 |
| `PUBLIC_GITHUB_HANDLE` | Zeigt das GitHub-Icon in der Seitenleiste                   |
| `PUBLIC_MASTODON_*`    | Aktiviert Mastodon-Kommentare und setzt Instanz/Profil-URLs |

## Beiträge schreiben

Erstelle Markdown-Dateien in `src/content/posts/de/`:

```markdown
---
title: 'Mein Beitragstitel'
description: 'Eine kurze Beschreibung für SEO und Listen.'
pubDate: 2026-05-03
tags: [tag1, tag2]
categories: [Kategorie]
---

Schreibe deinen Inhalt hier mit normalem Markdown.
```

### Verfügbare Frontmatter-Felder

| Feld          | Erforderlich | Beschreibung                         |
| ------------- | ------------ | ------------------------------------ |
| `title`       | Ja           | Beitragstitel (1–140 Zeichen)        |
| `description` | Ja           | Meta-Beschreibung (1–280 Zeichen)    |
| `pubDate`     | Ja           | Veröffentlichungsdatum im ISO-Format |
| `tags`        | Nein         | Liste von Tags                       |
| `categories`  | Nein         | Liste von Kategorien                 |
| `heroImage`   | Nein         | Pfad zu einem Beitragsbild           |
| `pinned`      | Nein         | Beitrag oben in Listen anheften      |
| `toc`         | Nein         | Inhaltsverzeichnis anzeigen          |
| `draft`       | Nein         | In Produktion ausblenden             |

## MDX verwenden

Für umfangreichere Inhalte kannst du `.mdx`-Dateien nutzen und Komponenten einbinden.

## Mehrsprachige Beiträge

Beiträge werden über das Feld `translationKey` miteinander verknüpft. Erstelle z. B. eine Datei in `src/content/posts/en/` und eine in `src/content/posts/de/` mit derselben Schlüsselkennung, damit der Sprachumschalter direkt zwischen den Versionen wechseln kann.

## Deployment

Push auf `main` bei GitHub. Der enthaltene Workflow baut die Seite und veröffentlicht sie automatisch über GitHub Pages.

Für eine eigene Domain setzt du `SITE_URL` in den Umgebungsvariablen deines Repositories unter **Settings → Environments → github-pages**.
