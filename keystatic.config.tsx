import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: { kind: 'github', repo: 'ostadthepforwork-cmd/display-works-media' },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        category: fields.text({ label: 'Category' }),
        date: fields.text({ label: 'Date' }),
        cover: fields.image({ label: 'Cover Image', directory: 'public/images/blog', publicPath: '/images/blog' }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
    portfolio: collection({
      label: 'Portfolio',
      slugField: 'title',
      path: 'src/content/portfolio/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        image: fields.image({ label: 'Image', directory: 'public/images/portfolio', publicPath: '/images/portfolio' }),
      },
    }),
  },
});