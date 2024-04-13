import {z} from "zod"

const ContentSchema = z.object({
    id: z.string(),
    blockId: z.string(),
    content: z.string(),
    date: z.date(),
    admin: z.string(),
    isDraft: z.boolean(),
    commitMessage: z.string()    
})

const SubsectionSchema = z.object({
    articleId: z.string(),
    title: z.string(),
/*     contents: ContentSchema.array(), */
})


const SourceSchema = z.object({
    id: z.string(),
    articleId: z.string(),
    url: z.string().url(),
    display: z.string(),
    admin: z.string(),
    date: z.string(),
    isDraft: z.boolean(),
    
})

const ArticleSchema = z.object({
    id: z.string(),
    topicId: z.string(),
    originalArticleUrl: z.string().url(),
    newsPortal: z.string(),
/*     subsections: SubsectionSchema.array(),
    source: SourceSchema.array() */
})


const TopicSchema = z.object({
    id: z.string(),
    title: z.string(),
    /* articles: ArticleSchema.array(), */
})




