import { z } from "zod";

export const ContentSchema = z.object({
  id: z.string(),
  blockid: z.string(),
  content: z.string(),
  date: z.string(),
  admin: z.string(),
  isdraft: z.boolean(),
  commitmessage: z.string(),
});

export const SubsectionSchema = z.object({
  id: z.string(),
  articleid: z.string(),
  title: z.string(),
  /*     contents: ContentSchema.array(), */
});

export const SourceSchema = z.object({
  id: z.string(),
  articleid: z.string(),
  url: z.string().url(),
  display: z.string(),
  admin: z.string(),
  date: z.string(),
  isdraft: z.boolean(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  topicid: z.string(),
  originalarticleurl: z.string().url(),
  newsportal: z.string(),
  isdraft: z.boolean()
  /*     subsections: SubsectionSchema.array(),
    source: SourceSchema.array() */
});

export const TopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  isdraft: z.boolean(),
  /* articles: ArticleSchema.array(), */
});

export const AdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  password: z.string(),
});

export const PostNewArticle = z.object({
  originalarticleurl: z.string().url(),
  newsportal: z.string(),
  subsections: z
    .object({
      title: z.string(),
      contents: z.object({
        content: z.string(),
        isdraft: z.boolean(),
        commitmessage: z.string(),
      }),
    })
    .array(),
  sources: z
    .object({
      url: z.string().url(),
      display: z.string(),
      isdraft: z.boolean(),
    })
    .array(),
    isdraft: z.boolean()
});



export const ReturningIdSchema = z.object({id: z.string()}).array();

export const HeadersSchema = z.object({
  authorization: z.string(),
});



export const PostNewTopicSchema = z.object({
  title: z.string(),
  articles: PostNewArticle.array(),
  isdraft: z.boolean(),
});
