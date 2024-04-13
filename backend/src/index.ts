import express from "express"
import cors from "cors"
import {z} from "zod"


const server = express()

server.use(cors())
server.use(express.json())


// post new topic, topic schema
server.post("/api/newtTopic")

// post new article to a topic
server.post("/api/:topicId/:articleId/")


//change topic title
server.patch("/api/:topicId")

// change articleId, articleURL, newsPortal
server.patch("/api/:topicId/:articleId")

// change subsection content, 
server.post("/api/:topicId/:articleId/:subsectionTitle/:contentId")

// change isDraft boolean
server.patch("/api/:topicId/:articleId/:subsectionTitle/:contentId/draft")


// change subsection content, url, display
server.post("/api/:topicId/:articleId/:subsectionTitle/:sourceId")

// change isDraft boolean
server.patch("/api/:topicId/:articleId/:subsectionTitle/:sourcesId")


server.delete("/api/topicId")

server.delete("/api/topicId/:articleId")

server.delete("/api/topicId/:articleId/:subsectionTitle")

server.delete("/api/topicId/:articleId/:subsectionTitle/:sourcesId")

server.delete("/api/topicId/:articleId/:subsectionTitle/:contentId")









server.listen(3000)