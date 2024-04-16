import express from "express";
import cors from "cors";
import { z } from "zod";
import {
  AdminSchema,
  ArticleSchema,
  ContentSchema,
  EmptyArraySchema,
  HeadersSchema,
  PostNewArticle,
  PostNewTopicSchema,
  SubsectionSchema,
  TopicSchema,
} from "./model";
import jwt from "jsonwebtoken";
import { insertQuery, selectQuery, updateQuery } from "./util/safeQuery";

const serverPassword = "ksjfbnsdjkfbdsjkfbkjb";

const server = express();

server.use(cors());
server.use(express.json());

const safeVerify = <Schema extends z.ZodTypeAny>(
  token: string,
  schema: Schema
): z.infer<typeof schema> | null => {
  try {
    const tokenPayload = jwt.verify(token, serverPassword);
    return schema.parse(tokenPayload);
  } catch (error) {
    return null;
  }
};

server.use(async (req, res, next) => {
  const result = HeadersSchema.safeParse(req.headers);
  if (!result.success) return next();

  const { authorization } = result.data;
  if (!authorization) return next();

  const tokenPayload = safeVerify(
    authorization,
    z.object({ name: z.string() })
  );
  if (!tokenPayload) return next();

  const admins = await selectQuery("admin", AdminSchema.array());
  if (!admins.success) return res.sendStatus(admins.status);

  const admin = admins.data.find((admin) => admin.name === tokenPayload.name);
  if (admin) return next();

  res.locals.admin = admin;
  next();
});

type Admin = z.infer<typeof AdminSchema>;

server.post("/api/newtTopic", async (req, res) => {
  const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401);

  const result = PostNewTopicSchema.safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const newTopic = result.data;
  /* topic insert sql */
  const responsePostTopic = await insertQuery(
    "topic",
    { title: newTopic.title, isDraft: newTopic.isDraft },
    EmptyArraySchema
  );
  if (!responsePostTopic.success)
    return res.sendStatus(responsePostTopic.status);

  /*obtain topic id  */
  const responseGetTopics = await selectQuery("topic", TopicSchema.array());
  if (!responseGetTopics.success)
    return res.sendStatus(responseGetTopics.status);

  const relevantTopic = responseGetTopics.data.find(
    (topic) => topic.title === newTopic.title
  );
  if (relevantTopic === undefined) return res.sendStatus(404);

  const topicId = relevantTopic.id;
  /*insert all articles  sql */
  const articleArrays = newTopic.articles;
  const date = new Date();
  articleArrays.map(async (article) => {
    const newArticleUrl = article.originalArticleUrl;

    const postNewArticle = {
      topicId: topicId,
      originalArticleUrl: newArticleUrl,
      newsPortal: article.newsPortal,
      isDraft: article.isDraft,
    };

    const responsePostArticle = await insertQuery(
      "article",
      postNewArticle,
      EmptyArraySchema
    );
    if (!responsePostArticle.success)
      return res.sendStatus(responsePostArticle.status);

    /*obtain article id */
    const responseGetArticles = await selectQuery(
      "article",
      ArticleSchema.array()
    );
    if (!responseGetArticles.success)
      return res.sendStatus(responseGetArticles.status);

    const relevantArticle = responseGetArticles.data.find(
      (responseArticle) => responseArticle.originalArticleUrl === newArticleUrl
    );
    if (relevantArticle === undefined) return res.sendStatus(404);

    const articleId = relevantArticle.id;

    /*insert all subsection sql */
    article.subsections.map(async (subsection) => {
      const subsectionTitle = subsection.title;

      const responsePostSubsection = await insertQuery(
        "subsection",
        { title: subsection.title, articleId: articleId },
        EmptyArraySchema
      );
      if (!responsePostSubsection.success)
        return res.sendStatus(responsePostSubsection.status);

      /*obtain subsection id */
      const responseGetSubsection = await selectQuery(
        "subsection",
        SubsectionSchema.array()
      );
      if (!responseGetSubsection.success)
        return res.sendStatus(responseGetSubsection.status);

      const relevantSubsection = responseGetSubsection.data.find(
        (responseSubsection) => responseSubsection.title === subsectionTitle
      );
      if (relevantSubsection === undefined) return res.sendStatus(404);

      const subsectionId = relevantSubsection.id;

      /*insert content sql */

      const subsectionContent = {
        blockId: subsectionId,
        content: subsection.contents.content,
        date: date,
        admin: admin.name,
        isDraft: subsection.contents.isDraft,
        commitMessage: subsection.contents.commitMessage,
      };
      const responsePostContent = await insertQuery(
        "content",
        subsectionContent,
        EmptyArraySchema
      );
      if (!responsePostContent.success)
        return res.sendStatus(responsePostContent.status);
    });
    /*insert all sources sql */

    article.sources.map(async (source) => {
      const sourcePost = {
        articleId: articleId,
        url: source.url,
        display: source.display,
        admin: admin.name,
        date: date,
        isDraft: source.isDraft,
      };

      const responsePostSource = await insertQuery(
        "content",
        sourcePost,
        EmptyArraySchema
      );
      if (!responsePostSource.success)
        return res.sendStatus(responsePostSource.status);
    });
  });

  res.json("Success");
});

// post new article to a topic
server.post("/api/:topicId/article/", async (req, res) => {
  const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401);

  const topicId = req.params.topicId;

  const result = PostNewArticle.safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const newArticle = result.data;
  const date = new Date();

  const postNewArticle = {
    topicId: topicId,
    originalArticleUrl: newArticle.originalArticleUrl,
    newsPortal: newArticle.newsPortal,
    isDraft: newArticle.isDraft,
  };

  const responsePostArticle = await insertQuery(
    "article",
    postNewArticle,
    EmptyArraySchema
  );
  if (!responsePostArticle.success)
    return res.sendStatus(responsePostArticle.status);

  /*obtain article id */
  const responseGetArticles = await selectQuery(
    "article",
    ArticleSchema.array()
  );
  if (!responseGetArticles.success)
    return res.sendStatus(responseGetArticles.status);

  const relevantArticle = responseGetArticles.data.find(
    (responseArticle) =>
      responseArticle.originalArticleUrl === newArticle.originalArticleUrl
  );
  if (relevantArticle === undefined) return res.sendStatus(404);

  const articleId = relevantArticle.id;

  /*insert all subsection sql */
  newArticle.subsections.map(async (subsection) => {
    const subsectionTitle = subsection.title;

    const responsePostSubsection = await insertQuery(
      "subsection",
      { title: subsection.title, articleId: articleId },
      EmptyArraySchema
    );
    if (!responsePostSubsection.success)
      return res.sendStatus(responsePostSubsection.status);

    /*obtain subsection id */
    const responseGetSubsection = await selectQuery(
      "subsection",
      SubsectionSchema.array()
    );
    if (!responseGetSubsection.success)
      return res.sendStatus(responseGetSubsection.status);

    const relevantSubsection = responseGetSubsection.data.find(
      (responseSubsection) => responseSubsection.title === subsectionTitle
    );
    if (relevantSubsection === undefined) return res.sendStatus(404);

    const subsectionId = relevantSubsection.id;

    /*insert content sql */

    const subsectionContent = {
      blockId: subsectionId,
      content: subsection.contents.content,
      date: date,
      admin: admin.name,
      isDraft: subsection.contents.isDraft,
      commitMessage: subsection.contents.commitMessage,
    };
    const responsePostContent = await insertQuery(
      "content",
      subsectionContent,
      EmptyArraySchema
    );
    if (!responsePostContent.success)
      return res.sendStatus(responsePostContent.status);
  });
  /*insert all sources sql */

  newArticle.sources.map(async (source) => {
    const sourcePost = {
      articleId: articleId,
      url: source.url,
      display: source.display,
      admin: admin.name,
      date: date,
      isDraft: source.isDraft,
    };

    const responsePostSource = await insertQuery(
      "source",
      sourcePost,
      EmptyArraySchema
    );
    if (!responsePostSource.success)
      return res.sendStatus(responsePostSource.status);
  });

  res.json("Success");
});

//change topic title
server.patch("/api/:topicId", async (req, res) => {
  const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401);

  const topicId = req.params.topicId;

  const result = TopicSchema.omit({ id: true }).safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const topic = result.data;
  const response = await updateQuery(
    "topic",
    { isDraft: topic.isDraft, title: topic.title },
    EmptyArraySchema,
    topicId
  );
  if (!response.success) return res.sendStatus(response.status);

  res.json("Success");
});

// change , articleURL, newsPortal
server.patch("/api/topic/:articleId", async (req, res) => {
  const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401);

  const articleId = req.params.articleId;

  const result = ArticleSchema.omit({ id: true, topicId: true }).safeParse(
    req.body
  );
  if (!result.success) return res.sendStatus(400);

  const article = result.data;
  const response = await updateQuery(
    "article",
    {
      isDraft: article.isDraft,
      newsPortal: article.newsPortal,
      originalArticleUrl: article.originalArticleUrl,
    },
    EmptyArraySchema,
    articleId
  );
  if (!response.success) return res.sendStatus(response.status);

  res.json("Success");
});

// change subsection content,
server.post("/api/topic/article/:subsectionId/content", async (req, res) => {
  const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401);

  const result = ContentSchema.omit({
    id: true,
    date: true,
    admin: true,
  }).safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const subsectionId = req.params.subsectionId;
  const content = result.data;
  const date = new Date();

  const newContent = {
    blockId: subsectionId,
    content: content.content,
    date: date,
    admin: admin.name,
    isDraft: content.isDraft,
    commitMessage: content.commitMessage,
  };

  const responsePostContent = await insertQuery(
    "content",
    newContent, 
    EmptyArraySchema
  );
  if (!responsePostContent.success)
    return res.sendStatus(responsePostContent.status);

  res.json("Success")

});

// change subsection content, url, display
server.post("/api/:topicId/:articleId/:subsectionTitle/:sourceId");

// change isDraft boolean
server.patch("/api/:topicId/:articleId/:subsectionTitle/:sourcesId");

server.delete("/api/topicId");

server.delete("/api/topicId/:articleId");

server.delete("/api/topicId/:articleId/:subsectionTitle");

server.delete("/api/topicId/:articleId/:subsectionTitle/:sourcesId");

server.delete("/api/topicId/:articleId/:subsectionTitle/:contentId");

server.listen(3000);
