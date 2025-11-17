# Redirect Functionality

The ili.nativeweb.org site now supports `redirect_from` functionality to create redirects from old URLs to new ones.

## How to Use

Add the `redirect_from` field to the front matter of any content file (`.md`, `.njk`, etc.):

### Single Redirect

```yaml
---
title: About
permalink: /about/
redirect_from: /about-us/
---
```

This will redirect `/about-us/` to `/about/`.

### Multiple Redirects

You can also specify multiple old URLs as an array:

```yaml
---
title: About
permalink: /about/
redirect_from:
  - /about-us/
  - /info/
  - /about-ili/
---
```

This will create redirects from:
- `/about-us/` → `/about/`
- `/info/` → `/about/`
- `/about-ili/` → `/about/`

## How It Works

1. The `content/eleventy-redirect.njk` template processes all pages with `redirect_from` data
2. For each redirect, it creates a simple HTML page with:
   - Meta refresh tag
   - Canonical link
   - JavaScript redirect
   - Fallback link for users with JavaScript disabled
   - `noindex` meta tag to prevent indexing of redirect pages

## Implementation

The redirect functionality is based on Eleventy's pagination feature to generate individual redirect pages. The template:

1. Scans all pages in `collections.all`
2. Finds pages with `redirect_from` data
3. Creates a separate HTML file for each redirect URL
4. Each redirect file automatically forwards to the target page

## Testing

To test a redirect, build the site and navigate to the old URL in your browser. You should be automatically redirected to the new URL.
