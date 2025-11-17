# Production Flag Implementation

The ili.nativeweb.org site now has a global `production` flag that can be used throughout the project to differentiate between development and production modes.

## Implementation

### 1. Global Data File

The production flag is implemented as a global data file at `_data/production.js`:

```javascript
export default (function () {
  return process.env.ELEVENTY_RUN_MODE === "build";
})();
```

This returns `true` when running in production mode (build), and `false` in development mode (serve/watch).

### 2. How It Works

Eleventy provides the `ELEVENTY_RUN_MODE` environment variable with values:
- `"build"` - Production builds (npm run build)
- `"serve"` - Development server (npm run start)
- `"watch"` - Watch mode

The production flag checks if the mode is "build" to determine production mode.

## Usage

### In Templates (Nunjucks)

The `production` variable is automatically available in all templates thanks to the data cascade:

```njk
  <title>DEV - {{ title }}</title>
{% endif %}
```

**Example from `_includes/partials/seo.njk`:**
```njk
{%- if production -%}
<title>{{title or metadata.title}}</title>
{%- else -%}
<title>DEV - {{title or metadata.title}}</title>
{%- endif -%}
```

This shows "DEV - " prefix in browser tabs when running in development mode, making it easy to distinguish between dev and production tabs.

### In Eleventy Config

Import the production flag in `eleventy.config.js`:

```javascript
import production from "./_data/production.js";
  if (production) {
    // Production-only configuration
    eleventyConfig.ignores.add("./content/drafts/*.md");
  } else {
    // Development-only configuration
    console.log("Running in development mode");
  }
}
```

### In Other JavaScript Files

You can import the production flag in any JavaScript file:

```javascript
import production from "./_data/production.js";

if (production) {
  // Production logic
} else {
  // Development logic
}
```

## Common Use Cases

### 1. Different Page Titles
Show "DEV - " prefix in development to distinguish tabs:
```njk
{% if production %}
  <title>{{ title }}</title>
{% else %}
  <title>DEV - {{ title }}</title>
{% endif %}
```

### 2. Different Favicons
Use different favicons for dev vs production:
```njk
{% if production %}
  <link rel="icon" href="/img/favicon.svg" type="image/svg+xml" />
{% else %}
  <link rel="icon" href="/img/favicon-dev.svg" type="image/svg+xml" />
{% endif %}
```

### 3. Exclude Draft Content
Exclude drafts from production builds:
```javascript
if (production) {
  eleventyConfig.ignores.add("./content/drafts/*.md");
}
```

### 4. Analytics and Tracking
Only include analytics in production:
```njk
{% if production %}
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
{% endif %}
```

### 5. Asset Minification
Minify assets only in production:
```javascript
if (production) {
  // Add minification plugins
}
```

### 6. Debug Information
Show debug info only in development:
```njk
{% if not production %}
  <div class="debug-info">
    <p>Template: {{ page.inputPath }}</p>
    <p>URL: {{ page.url }}</p>
  </div>
{% endif %}
```

## NPM Scripts

The package.json already has proper scripts configured:

```json
{
  "scripts": {
    "build": "npx @11ty/eleventy",           // Production mode
    "start": "npx @11ty/eleventy --serve",   // Development mode
    "debug": "DEBUG=Eleventy* npx @11ty/eleventy"
  }
}
```

## Testing

To test the production flag:

1. **Development mode:**
   ```bash
   npm run start
   ```
   Visit http://localhost:8080/ and check the browser tab title starts with "DEV - "

2. **Production mode:**
   ```bash
   npm run build
   ```
   Check the generated files in `_site/` - titles should NOT have "DEV - " prefix

## Benefits

1. **Portable** - Works across all operating systems
2. **No Manual Configuration** - No need to set environment variables
3. **Globally Available** - Use in templates, config, and JavaScript files
4. **Simple** - Easy to understand and maintain
5. **Built-in** - Uses Eleventy's native environment variables

## 7. Asset Optimization (Production Only)

The production build automatically optimizes assets for maximum performance:

### CSS & JavaScript Inlining
- External CSS files are inlined into `<style>` tags
- External JavaScript files are inlined into `<script>` tags  
- **Reduces HTTP requests** by eliminating separate file downloads
- CSS is minified during inlining using CleanCSS (level 2)
- External URLs (CDNs) are preserved and **not** inlined
- Only local files in `_site` directory are inlined

### HTML Minification
- Collapses whitespace
- Removes comments
- Minifies inline CSS and JavaScript
- Removes redundant attributes
- Uses short doctype

### Compression
After building, all HTML and CSS files are compressed using:
- **Gzip** (level 9) - Creates `.gz` files
- **Brotli** (quality 11) - Creates `.br` files

Your web server can automatically serve these compressed versions when supported by the browser.

### Size Comparison
Example from actual build:
- **Original** (with inlined assets): `index.html` (107 KB)
- **Gzipped**: `index.html.gz` (30 KB) - 72% reduction
- **Brotli**: `index.html.br` (27 KB) - 75% reduction

### Benefits
- ✅ **Fewer HTTP requests**: All critical CSS/JS is inlined in the HTML
- ✅ **Faster initial load**: No render-blocking external stylesheets
- ✅ **Optimized delivery**: Compressed files served by modern web servers
- ✅ **Development friendly**: Inlining only happens in production builds

## Credits

This implementation is based on the tutorial by Rob O'Leary:
- Tutorial: https://www.roboleary.net/webdev/2024/01/24/eleventy-production-flag
- GitHub: https://github.com/robole/eleventy-tutorials/tree/main/production-flag
