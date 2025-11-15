# CHANGELOG
1. show name in header next logo. show name in blue ```#171b39``` - DONE
2. set filter to disable find us in the contact widget - DONE
3. set filter to disable contact form on homepage - DONE
3. set filter to disable Why Chose Us - DONE
3. enable ```image_credit:``` front matter and have it show under the images left aligned in plain text. - DONE
4. Enable Eleventy Heading Anchors and linking to anchors (Get TOC working on long posts) like [/ili-report](/ili-report) and [ili-info](/ili_info/) - DONE `show_toc: true`
5. Enable Eleventy Footnotes - DONE
5. fix nesting of heading tags on homepage - DONE
11. add schemea.njk to be filled in - 
What is this for and where is it placed? Because the schema takes data from the frontmatter yaml / json and markdown.

## Optional
12. is search possible? like a /search/ page  - DONE
~~12. fix notices on npm run~~
~~6. enable authors. Individually authored posts only.~~
 


***

# ili.nativeweb.org

A Project developed by [Adam DJ Brett](https://adamdjbrett.com)

Need Help or Have Project ?? Contact Me
+ https://adamdjbrett.com
+ info@adamdjbrett.com

### HOW TO 

+ Setup your site SEO and others on `_data/metadata.yaml`
+ Update Navbar on `_data/navbar.yaml`
+ Update Footer on `_data/footer.yaml`
+ Update Widget on `_data/widget.yaml`
+ Update Galleries on `_data/galleries.yaml`
+ Update Page on `content/page/*.md`
+ Update Blog on `content/blog/*.md`

Use Widget: 
You can disable or show the widget on static page or blog post. True for show , and false for hide the widget 

Implementation
```
show_post_list: false
show_info: false
show_contact_form: false
```

Need Help or Have Project ?? Contact Me
+ https://adamdjbrett.com
+ info@adamdjbrett.com
