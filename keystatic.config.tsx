import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'cloud',
  },
  cloud: {
    project: 'ostadthepforwork-cmd/display-works-media',
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.text({ label: 'Content', multiline: true }),
      },
    }),
  },
});