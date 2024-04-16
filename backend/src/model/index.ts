import { z } from "zod";

export const ContentSchema = z.object({
  id: z.string(),
  blockId: z.string(),
  content: z.string(),
  date: z.date(),
  admin: z.string(),
  isDraft: z.boolean(),
  commitMessage: z.string(),
});

export const SubsectionSchema = z.object({
  id: z.string(),
  articleId: z.string(),
  title: z.string(),
  /*     contents: ContentSchema.array(), */
});

export const SourceSchema = z.object({
  id: z.string(),
  articleId: z.string(),
  url: z.string().url(),
  display: z.string(),
  admin: z.string(),
  date: z.string(),
  isDraft: z.boolean(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  originalArticleUrl: z.string().url(),
  newsPortal: z.string(),
  /*     subsections: SubsectionSchema.array(),
    source: SourceSchema.array() */
});

export const TopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  isDraft: z.boolean()
  /* articles: ArticleSchema.array(), */
});

export const AdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  password: z.string(),
});

export const PostNewTopicSchema = z.object({
  title: z.string(),
  articles: z
    .object({
      originalArticleUrl: z.string().url(),
      newsPortal: z.string(),
      subsections: z
        .object({
          title: z.string(),
          contents: z.object({
            content: z.string(),
            isDraft: z.boolean(),
            commitMessage: z.string(),
          }),
        })
        .array(),
      sources: z
        .object({
          url: z.string().url(),
          display: z.string(),
          isDraft: z.boolean(),
        })
        .array(),
    })
    .array(),
    isDraft: z.boolean()
});

export const EmptyArraySchema = z.array(z.never());

export const HeadersSchema = z.object({
  authorization: z.string(),
});
