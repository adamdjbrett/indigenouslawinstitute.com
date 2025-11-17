import {IdAttributePlugin,InputPathToUrlTransformPlugin,HtmlBasePlugin,} from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import yaml from "js-yaml";
import { execSync } from "child_process";
import fontAwesomePlugin from "@11ty/font-awesome";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItFootnote from "markdown-it-footnote";
import markdownItAttrs from 'markdown-it-attrs';
import markdownItTableOfContents from "markdown-it-table-of-contents";
import pluginTOC from 'eleventy-plugin-toc';
import pluginFilters from "./_config/filters.js";
import production from "./_data/production.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
	// Example: Use production flag in config
	// if (production) {
	//   eleventyConfig.ignores.add("./content/drafts/*.md");
	// }
	
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});
	eleventyConfig.addPlugin(fontAwesomePlugin, {
		transform: 'i[class]',
		shortcode: false,
		failOnError: true,
		defaultAttributes: {
			class: 'icon-svg'
		}
	});

	  eleventyConfig.addFilter("featuredPosts", function(collection) {
    return collection.filter(post => post.data.tags && post.data.tags.includes('featured'));
	 });
	
	// Create authors collection
	eleventyConfig.addCollection("authors", function(collectionApi) {
		return collectionApi.getFilteredByGlob("./content/authors/*.md");
	});
	eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/",
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

	eleventyConfig.addWatchTarget("css/**/*.css");
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");

	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "style",
	});
	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: 'script[type="module"]',
	});

	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 },
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
	const md = new markdownIt({
		html: true,
		breaks: true,
		linkify: true,
	});
	eleventyConfig.addFilter("md", function (content) {
		return md.render(content);
	});

  let options = {
    html: true,
    breaks: true,
    linkify: true,
      permalink: true,
    typographer: true,
      permalinkClass: "direct-link",
      permalinkSymbol: "#"
  };

	
   let markdownLib = markdownIt(options).use(markdownItAttrs).use(markdownItFootnote).use(markdownItTableOfContents);
  eleventyConfig.setLibrary("md", markdownLib);
	  eleventyConfig.amendLibrary("md", mdLib => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "",
				ariaHidden: false,
			}),
			level: [1,2,3,4],
			slugify: eleventyConfig.getFilter("slugify")
		});
	});
	  eleventyConfig.addPlugin(pluginTOC, {
		tags: ['h2', 'h3', 'h4', 'h5'],
		  id: 'toci', 
		  class: 'list-group',
		ul: true,
		flat: true,
		wrapper: 'div'
	  });

	eleventyConfig.on("eleventy.after", () => {
		execSync(`npx pagefind --site _site --glob \"**/*.html\"`, {
			encoding: "utf-8",
		});
	});

	eleventyConfig.addPlugin(IdAttributePlugin, {
		slugify: (text) => {
			const slug = eleventyConfig.getFilter("slugify")(text);
			return `print-${slug}`;
		},
	});

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "Feed",
				order: 10,
			},
		},
		collection: {
			name: "all",
			limit: 20,
		},
		metadata: {
			language: "en",
			title:
				"Editorial",
			subtitle:
				"Editorial 11ty.",
			base: "https://www.example.com/",
			author: {
				name: "adamdjbrett",
			},
		},
	});

	eleventyConfig.addPlugin(pluginFilters);

	// Production-only HTML minification transform
	if (production) {
		const { minify } = await import("html-minifier-terser");
		eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
			if (outputPath && outputPath.endsWith(".html")) {
				try {
					return await minify(content, {
						collapseWhitespace: true,
						removeComments: true,
						removeRedundantAttributes: true,
						useShortDoctype: true,
						removeEmptyAttributes: true,
						minifyCSS: true,
						minifyJS: true,
					});
				} catch (e) {
					console.warn("HTML minification failed for", outputPath, e.message);
					return content;
				}
			}
			return content;
		});
	}

	// After build: compress HTML and CSS assets with gzip and brotli (production only)
	if (production) {
		eleventyConfig.on("eleventy.after", async () => {
			const fs = await import("fs");
			const path = await import("path");
			const zlib = await import("zlib");
			const root = path.default.join(process.cwd(), "_site");
			/** Recursively walk output directory */
			function walk(dir) {
				return fs.default.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
					const res = path.default.join(dir, entry.name);
					if (entry.isDirectory()) return walk(res);
					return [res];
				});
			}
			const files = walk(root).filter(f => /\.(html|css)$/.test(f));
			for (const file of files) {
				try {
					const content = fs.default.readFileSync(file);
					// gzip
					const gz = zlib.default.gzipSync(content, { level: 9 });
					fs.default.writeFileSync(file + ".gz", gz);
					// brotli
					const br = zlib.default.brotliCompressSync(content, {
						params: { [zlib.default.constants.BROTLI_PARAM_QUALITY]: 11 }
					});
					fs.default.writeFileSync(file + ".br", br);
				} catch (e) {
					console.warn("Compression failed for", file, e.message);
				}
			}
			console.log(`Compressed ${files.length} HTML/CSS assets (gzip & brotli).`);
		});
	}

	eleventyConfig.addPlugin(IdAttributePlugin, {});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return new Date().toISOString();
	});
}

export const config = {
	templateFormats: ["md", "njk", "html", "liquid", "11ty.js"],

	markdownTemplateEngine: "njk",

	htmlTemplateEngine: "njk",

	dir: {
		input: "content", // default: "."
		includes: "../_includes", // default: "_includes" (`input` relative)
		data: "../_data", // default: "_data" (`input` relative)
		output: "_site",
	},
};
