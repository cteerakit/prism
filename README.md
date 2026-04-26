# Prism Browser Extension

Prism is a browser extension built with WXT + React.

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Start development (Chromium):

```bash
npm run dev
```

Start development (Firefox):

```bash
npm run dev:firefox
```

WXT prints instructions in the terminal for loading the extension in your browser while developing.

## Available Scripts

- `npm run dev` - Run extension in development mode (Chromium)
- `npm run dev:firefox` - Run extension in development mode (Firefox)
- `npm run build` - Build production files (Chromium)
- `npm run build:firefox` - Build production files (Firefox)
- `npm run zip` - Build and package a Chromium zip
- `npm run zip:firefox` - Build and package a Firefox zip
- `npm run compile` - Type-check TypeScript with no emit

## Production Build

Build extension artifacts:

```bash
npm run build
```

Or create zipped distribution files:

```bash
npm run zip
```

## Permissions

Prism requests a minimal set of permissions:

- `bookmarks` - read bookmarks to render the bookmark bar widget.
- `favicon` - load bookmark favicons using the extension favicon pipeline.
- `https://ice1.somafm.com/*` and `https://ice2.somafm.com/*` - stream SomaFM audio in the music widget.
