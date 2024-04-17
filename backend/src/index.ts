import express from "express";
import cors from "cors";
import { z } from "zod";
import {
  AdminSchema,
  ArticleSchema,
  ContentSchema,
  ReturningIdSchema,
  HeadersSchema,
  PostNewArticle,
  PostNewTopicSchema,
  SourceSchema,
  SubsectionSchema,
  TopicSchema,
} from "./model";
import jwt from "jsonwebtoken";
import {
  client,
  deleteQuery,
  insertQuery,
  selectQuery,
  updateQuery,
} from "./util/safeQuery";
import moment, { Moment } from "moment";

const serverPassword = "ksjfbnsdjkfbdsjkfbkjb";

const server = express();

server.use(cors());
server.use(express.json());

type SourceType = z.infer<typeof SourceSchema>;
type ArticleType = z.infer<typeof ArticleSchema>;
type ContentType = z.infer<typeof ContentSchema>;
type SubsectionType = z.infer<typeof SubsectionSchema>;
type TopicType = z.infer<typeof TopicSchema>;
type IdArrayType = z.infer<typeof ReturningIdSchema>

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
client.connect();


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


server.post("/api/newTopic", async (req, res) => {
  /*  const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401); */

  const result = PostNewTopicSchema.safeParse(req.body);
  if (!result.success) {
    console.log(result.error);
    return res.sendStatus(400);
  }

  const newTopic = result.data;

  const postNewTopic: Omit<TopicType, "id"> = {
    title: newTopic.title,
    isdraft: newTopic.isdraft,
  };
  /* topic insert sql */
  const responsePostTopic = await insertQuery(
    "topic",
    postNewTopic,
    ReturningIdSchema)
  if (!responsePostTopic.success)
    return res.sendStatus(responsePostTopic.status);


  const topicId = responsePostTopic.data[0].id;

  /*insert all articles  sql */
  const articleArrays = newTopic.articles;
  const date = moment().format();
  for (const article of articleArrays) {
    const newArticleUrl = article.originalarticleurl;

    const postNewArticle: Omit<ArticleType, "id"> = {
      topicid: topicId,
      originalarticleurl: newArticleUrl,
      newsportal: article.newsportal,
      isdraft: article.isdraft,
    };

    console.log(postNewArticle)

    const responsePostArticle = await insertQuery(
      "article",
      postNewArticle,
      ReturningIdSchema
    );
    if (!responsePostArticle.success)
      return res.sendStatus(responsePostArticle.status);



    const articleId = responsePostArticle.data[0].id;

    /*insert all subsection sql */
      for (const subsection of article.subsections)  {

      const postNewSubsection: Omit<SubsectionType, 'id'>= {
        title: subsection.title,
        articleid: articleId
      }

      const responsePostSubsection = await insertQuery(
        "subsection",
        postNewSubsection,
        ReturningIdSchema
      );
      if (!responsePostSubsection.success)
        return res.sendStatus(responsePostSubsection.status); 


      const subsectionId = responsePostSubsection.data[0].id
      


      /*insert content sql */
      const subsectionContent: Omit<ContentType, 'id'> = {
        blockid: subsectionId,
        content: subsection.contents.content,
        date: date,
        admin: "Zsombor Nagy",
        isdraft: subsection.contents.isdraft,
        commitmessage: subsection.contents.commitmessage,
      };
      const responsePostContent = await insertQuery(
        "content",
        subsectionContent,
        ReturningIdSchema
      );
      if (!responsePostContent.success)
        return res.sendStatus(responsePostContent.status);
    }; 

    /*insert all sources sql */

    for (const source of article.sources)  {
      const sourcePost: Omit<SourceType, 'id'> = {
        articleid: articleId,
        url: source.url,
        display: source.display,
        admin: "Zsombor Nagy",
        date: date,
        isdraft: source.isdraft,
      };

      const responsePostSource = await insertQuery(
        "source",
        sourcePost,
        ReturningIdSchema
      );
      if (!responsePostSource.success)
        return res.sendStatus(responsePostSource.status);
    }
  };

  res.json("Success");
});

// post new article to a topic
server.post("/api/:topicId/article", async (req, res) => {
/*   const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401); */

  const topicId = req.params.topicId;

  const result = PostNewArticle.safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const newArticle = result.data;
  const date = moment().format();

  const postNewArticle: Omit<ArticleType, "id"> = {
    topicid: topicId,
    originalarticleurl: newArticle.originalarticleurl,
    newsportal: newArticle.newsportal,
    isdraft: newArticle.isdraft,
  };

  const responsePostArticle = await insertQuery(
    "article",
    postNewArticle,
    ReturningIdSchema
  );
  if (!responsePostArticle.success)
    return res.sendStatus(responsePostArticle.status);


  const articleId = responsePostArticle.data[0].id;

  /*insert all subsection sql */
  newArticle.subsections.map(async (subsection) => {


    const postNewSubsection: Omit<SubsectionType, "id"> = {
      title: subsection.title,
      articleid: articleId,
    };

    const responsePostSubsection = await insertQuery(
      "subsection",
      postNewSubsection,
      ReturningIdSchema
    );
    if (!responsePostSubsection.success)
      return res.sendStatus(responsePostSubsection.status);


    const subsectionId = responsePostSubsection.data[0].id

    /*insert content sql */

    const subsectionContent: Omit<ContentType, "id"> = {
      blockid: subsectionId,
      content: subsection.contents.content,
      date: date,
      admin: "Zsombor Nagy",
      isdraft: subsection.contents.isdraft,
      commitmessage: subsection.contents.commitmessage,
    };
    const responsePostContent = await insertQuery(
      "content",
      subsectionContent,
      ReturningIdSchema
    );
    if (!responsePostContent.success)
      return res.sendStatus(responsePostContent.status);
  });
  /*insert all sources sql */

  newArticle.sources.map(async (source) => {
    const postNewSource: Omit<SourceType, "id"> = {
      articleid: articleId,
      url: source.url,
      display: source.display,
      admin: "Zsombor Nagy",
      date: date,
      isdraft: source.isdraft,
    };

    const responsePostSource = await insertQuery(
      "source",
      postNewSource,
      ReturningIdSchema
    );
    if (!responsePostSource.success)
      return res.sendStatus(responsePostSource.status);
  });

  res.json("Success");
});

//change topic title
server.patch("/api/:topicId", async (req, res) => {
/*   const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401); */

  const topicId = req.params.topicId;

  const result = TopicSchema.omit({ id: true }).safeParse(req.body);

  if (!result.success) return res.sendStatus(400);

  const topic = result.data;

  const postNewTopic: Omit<TopicType, "id"> = {
    isdraft: topic.isdraft,
    title: topic.title,
  };
  const response = await updateQuery(
    "topic",
    postNewTopic,
    ReturningIdSchema,
    topicId
  );
  if (!response.success) return res.sendStatus(response.status);

  res.json("Success");
});

// change , articleURL, newsPortal
server.patch("/api/topic/:articleId", async (req, res) => {
/*   const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401);
 */
  const articleId = req.params.articleId;

  const result = ArticleSchema.omit({ id: true, topicid: true }).safeParse(
    req.body
  );
  if (!result.success) {
    console.log(result.error)
    return res.sendStatus(400);
  } 

  const article = result.data;

  const patchArticle: Omit<ArticleType, "id" | "topicid"> = {
    isdraft: article.isdraft,
    newsportal: article.newsportal,
    originalarticleurl: article.originalarticleurl,
  };
  const response = await updateQuery(
    "article",
    patchArticle,
    ReturningIdSchema,
    articleId
  );
  if (!response.success) return res.sendStatus(response.status);

  res.json("Success");
});

// change subsection content,
server.post("/api/topic/article/:subsectionId/content", async (req, res) => {
/*   const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401); */

  const result = ContentSchema.omit({
    id: true,
    date: true,
    admin: true,
    blockid: true
  }).safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const subsectionId = req.params.subsectionId;
  const content = result.data;
  const date = moment().format();

  const postNewContent: Omit<ContentType, "id"> = {
    blockid: subsectionId,
    date: date,
    admin: "Zsombor Nagy",
    isdraft: content.isdraft,
    commitmessage: content.commitmessage,
    content: content.content,
  };

  const responsePostContent = await insertQuery(
    "content",
    postNewContent,
    ReturningIdSchema
  );
  if (!responsePostContent.success)
    return res.sendStatus(responsePostContent.status);

  res.json("Success");
});

// change source content, url, display
server.post("/api/topic/:articleId/source", async (req, res) => {
/*   const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401); */

  const result = SourceSchema.omit({
    id: true,
    date: true,
    admin: true,
    articleid: true
  }).safeParse(req.body);
  if (!result.success) return res.sendStatus(400);

  const articleId = req.params.articleId;
  const source = result.data;
  const date = moment().format();

  const postNewSource: Omit<SourceType, "id"> = {
    articleid: articleId,
    display: source.display,
    date: date,
    admin: "Zsombor Nagy",
    isdraft: source.isdraft,
    url: source.url,
  };

  const responsePostContent = await insertQuery(
    "source",
    postNewSource,
    ReturningIdSchema
  );
  if (!responsePostContent.success)
    return res.sendStatus(responsePostContent.status);

  res.json("Success");
});

server.delete("/api/:topicId", async ( req, res) =>{
  /*   const admin = res.locals.admin as Admin;
  if (!admin) return res.sendStatus(401); */
  const topicId = req.params.topicId

  const deleteTopicResponse = await deleteQuery('topic', {id: topicId}, ReturningIdSchema)
  if (!deleteTopicResponse.success)
    return res.sendStatus(deleteTopicResponse.status);


  const deleteArticlesResponse = await deleteQuery('article', {topicid: topicId}, ReturningIdSchema)
  if (!deleteArticlesResponse.success)
    return res.sendStatus(deleteArticlesResponse.status);

  const articleIdArray: IdArrayType = deleteArticlesResponse.data

  for (const article of articleIdArray) {
    const id = article.id

    const deleteSubsectionResponse = await deleteQuery('subsection', {articleid: id}, ReturningIdSchema)
    if (!deleteSubsectionResponse.success)
      return res.sendStatus(deleteSubsectionResponse.status);

    const subsectionIdArray: IdArrayType = deleteSubsectionResponse.data

    for (const subsection of subsectionIdArray) {
      const id = subsection.id

      const deleteContentResponse = await deleteQuery('content', {blockid: id}, ReturningIdSchema)
      if (!deleteContentResponse.success)
        return res.sendStatus(deleteContentResponse.status);


    }

    for (const source of articleIdArray) {
      const id = article.id

      const deleteSourceResponse = await deleteQuery('subsection', {articleid: id}, ReturningIdSchema)
      if (!deleteSourceResponse.success)
        return res.sendStatus(deleteSourceResponse.status);
    }
  

  }




});

server.delete("/api/:topicId/article", async (req, res) => {

  const topicId = req.params.topicId

  const deleteArticlesResponse = await deleteQuery('article', {topicid: topicId}, ReturningIdSchema)
  if (!deleteArticlesResponse.success)
    return res.sendStatus(deleteArticlesResponse.status);

  const articleIdArray: IdArrayType = deleteArticlesResponse.data

  for (const article of articleIdArray) {
    const id = article.id

    const deleteSubsectionResponse = await deleteQuery('subsection', {articleid: id}, ReturningIdSchema)
    if (!deleteSubsectionResponse.success)
      return res.sendStatus(deleteSubsectionResponse.status);

    const subsectionIdArray: IdArrayType = deleteSubsectionResponse.data

    for (const subsection of subsectionIdArray) {
      const id = subsection.id

      const deleteContentResponse = await deleteQuery('content', {blockid: id}, ReturningIdSchema)
      if (!deleteContentResponse.success)
        return res.sendStatus(deleteContentResponse.status);


    }

    for (const source of articleIdArray) {
      const id = article.id

      const deleteSourceResponse = await deleteQuery('subsection', {articleid: id}, ReturningIdSchema)
      if (!deleteSourceResponse.success)
        return res.sendStatus(deleteSourceResponse.status);
    }
  

  }


  res.json("deleted")
});

server.delete("/api/topic/:articleId/subsection");

server.delete("/api/topic/:articleId/source");


server.delete("/api/topicId/article/subsection/:contentId");

server.listen(3000);
process.on("SIGINT", () => {
  client.end();
  process.exit(0);
});
