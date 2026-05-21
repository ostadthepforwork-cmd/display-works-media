import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: { kind: 'github', repo: 'ostadthepforwork-cmd/display-works-media' },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});