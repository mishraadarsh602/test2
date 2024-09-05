// const chatSession = require("../../models/chat/chatSession.model");
// const userSession = require("../../models/chat/globalSession.model");
// const { v5: uuidv5, v4: uuidv4 } = require("uuid");
// const { TopicColor } = require("../../models/topic");
// const { topicService } = require("../topic");
// const { Topic } = require("../../models/topic");
// const { globalPrompt } = require("../../models/topic");
// const mongoose = require("mongoose");
// const { Configuration, OpenAI } = require("openai");
// const { similaritySearch } = require("../openAi/pineconeService");

// const getRandomColor = async () => {
//   let bgcolor = await TopicColor.find({});
//   bgcolor = bgcolor[0].background;
//   const randomIndex = Math.floor(Math.random() * bgcolor.length);
//   return bgcolor[randomIndex];
// };

// const formatPrompt = async (data) => {
//   let coach_prompt = "";
//   availbleTopic = await getTopicByName(data);
//   if (availbleTopic) {
//     const prompt = await globalPrompt.find({});
//     // coach_prompt = availbleTopic.prompt;
//     if (availbleTopic?.useGPT4Prompt) {
//       availbleTopic.prompt = availbleTopic?.prompt4;
//     }

//     coach_prompt = availbleTopic.prompt.replace(
//       /{SystemRole}/g,
//       prompt[0].systemRoleList[data.role]
//     );
//     coach_prompt = coach_prompt.replace(/{topicName}/g, data.topic);
//     coach_prompt = coach_prompt.replace(/{subtopic}/g, data.subtopic);
//     coach_prompt = coach_prompt.replace(/{subtopic}/g, data.subtopic);
//     coach_prompt = coach_prompt.replace(/{userLevel}/g, data.level);
//   } else {
//     const prompt = await globalPrompt.find({});
//     coach_prompt = prompt[0].prompt;
//     if (prompt[0]?.useGPT4Prompt) {
//       coach_prompt = prompt[0].prompt4;
//     }

//     coach_prompt = coach_prompt.replace(
//       /{SystemRole}/g,
//       prompt[0].systemRoleList[data.role]
//     );
//     coach_prompt = coach_prompt.replace(/{topicName}/g, data.topic);
//     coach_prompt = coach_prompt.replace(/{subtopic}/g, data.subtopic);
//     coach_prompt = coach_prompt.replace(/{userLevel}/g, data.level);
//   }
//   return coach_prompt;
// };

// const getTopicByName = async (data) => {
//   const matchingTopics = await Topic.find({
//     $and: [
//       {
//         name: data.topic,
//       },
//       {
//         "sub_topics.name": {
//           $regex: data.subtopic,
//           $options: "i",
//         },
//       },
//     ],
//   });
//   if (matchingTopics.length == 0) {
//     return null;
//   } else {
//     Topic.findByIdAndUpdate(
//       matchingTopics[0]._id,
//       {
//         $set: { readCount: matchingTopics[0].readCount + 1 },
//       },
//       { new: true, upsert: true }
//     ).then((updatedTopic) => {
//       console.log(updatedTopic);
//     });
//   }
//   return matchingTopics[0];
// };
// const getTopicBySubTopics = async (data) => {
//   const matchingTopics = await Topic.find({
//     "sub_topics.name": {
//       $regex: data.subtopic,
//       $options: "i",
//     },
//   });
//   if (matchingTopics.length == 0) {
//     return null;
//   }

//   return matchingTopics[0];
// };

// const createConversation = async (userId, data, wlType = false) => {
//   const conversationId = uuidv4();
//   const prompt = await globalPrompt.find({});
//   coach_prompt = prompt[0].mainAgentPrompt;
//   coach_prompt = coach_prompt.replace(/{coachname}/g, topic.name);
//   const newConverstaion = await chatSession.create({
//     userId: userId,
//     startTime: Date.now(),
//     timeSpent: 5000,
//     lastTime: Date.now(),
//     conversationId,
//   });
//   return newConverstaion;
// };

// const createGlobalConversationState = async (userId, chatId) => {
//   const conversationState = await userSession.create({
//     userId: userId,
//     timeSpent: 5000,
//     chatsessions: [],
//   });

//   return conversationState;
// };

// const getPromptByTopic = async (user, data) => {
//   let matchingTopics;
//   const { topic, subtopic, topicId } = data.topicData;
//   if (topicId != "") {
//     matchingTopics = await Topic.findById(topicId);
//   } else if (topic != "" && subtopic != "") {
//     matchingTopics = await getTopicByName(data);
//   } else if (subtopic != "") {
//     // matchingTopics = await getTopicBySubTopics(data);
//     return null;
//   }
//   return matchingTopics;
// };

// // const getConversationByTopic = async (userId, data) => {
// //   let converstaions = [];
// //   const { topic, subtopic, topicId, subtopicId } = data;
// //   if (topicId != "" && subtopicId != "") {
// //     converstaions = await chatSession.find({
// //       userId,
// //       topicId,
// //       subtopicId,
// //     });
// //   } else if (topicId != "") {
// //     converstaions = await chatSession.find({
// //       userId,
// //       topicId,
// //     });
// //   } else if (subtopic != "" && topic != "") {
// //     converstaions = await chatSession.find({
// //       userId,
// //       topic,
// //       subtopic,
// //     });
// //   }
// //   if (converstaions.length == 0) {
// //     return null;
// //   }
// //   return converstaions[0];
// // };

// const getConversationById = async (
//   userId,
//   conversationId,
//   promptRev = true
// ) => {
//   const converstaions = await chatSession.find({
//     userId: userId,
//     conversationId: conversationId,
//   });
//   if (converstaions.length == 0) {
//     return null;
//   }
//   // if (!promptRev) {
//   //   converstaions[0].threads = converstaions[0].threads.map((res) => {
//   //     console.log(res.messages.slice(1));
//   //     return { ...res, messages: res.messages.slice(1) };
//   //   });
//   // }
//   return converstaions[0].messages;
// };

// const getGlobalConversationState = async (userId, data) => {
//   const session = await userSession.find({
//     userId: userId,
//   });
//   console.log(userId, session);
//   if (session.length == 0) {
//     return null;
//   }
//   return session[0];
// };
// const updateConversation = async (conversationId, conversationData) => {
//   const session = await chatSession.findOneAndUpdate(
//     {
//       conversationId,
//     },
//     { $set: conversationData },
//     { new: true, upsert: true }
//   );
//   return session;
// };
// const updateConversationThread = async (threadId, messageBody) => {
//   const session = await chatSession.findOneAndUpdate(
//     {
//       "threads.threadId": threadId,
//     },
//     {
//       $push: { "threads.$.messages": { $each: messageBody } },
//     },
//     { new: true, upsert: true }
//   );
//   return session;
// };
// const createConversationThread = async (conversationId, threadBody) => {
//   const threadId = uuidv4();
//   Object.assign(threadBody, { threadId });
//   const session = await chatSession.findOneAndUpdate(
//     {
//       conversationId,
//     },
//     {
//       $set: { activeThread: threadId },
//       $push: { threads: threadBody },
//     },
//     { new: true, upsert: true }
//   );
//   console.log(session);
//   return session;
// };
// const updateGlobalConversationState = async (userId, updatedBody) => {
//   const session = await userSession.findOneAndUpdate(
//     {
//       userId,
//     },
//     updatedBody,
//     { new: true, upsert: true }
//   );
// };
// const getUserSession = async (userId) => {
//   let sessions = await chatSession
//     .aggregate([
//       {
//         $match: {
//           userId: new mongoose.Types.ObjectId(userId),
//         },
//       },
//       {
//         $project: {
//           threads: {
//             $map: {
//               input: "$threads",
//               as: "thread",
//               in: {
//                 threadName: "$$thread.threadName",
//                 threadId: "$$thread.threadId",
//                 createdAt: "$$thread.createdAt",
//                 updatedAt: "$$thread.updatedAt",
//                 _id: "$$thread._id",
//                 messages: {
//                   $slice: [
//                     "$$thread.messages",
//                     1,
//                     {
//                       $size: "$$thread.messages",
//                     },
//                   ],
//                 },
//               },
//             },
//           },
//           startTime: 1,
//           timeSpent: 1,
//           lastTime: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           activeThread: 1,
//           userId: 1,
//           chatType: 1,
//           sessionId: 1,
//           conversationId: 1,
//           topic: 1,
//           color: 1,
//           subtopic: 1,
//         },
//       },
//       {
//         $sort: {
//           updatedAt: -1,
//         },
//       },
//     ])
//     .exec();
//   // const sessions = await chatSession.find({ userId }).sort({ updatedAt: -1 });
//   // const result = sessions.map(({ res }) => ({
//   //   threads: res.map(({ messages }) => ({ messages: messages.slice(1) })),
//   // }));

//   return sessions;
// };
// const currentConversation = async (userId) => {
//   const sessions = await chatSession
//     .find({ userId })
//     .sort({ updatedAt: -1 })
//     .limit(1)
//     .lean();
//   sessions[0].threads = sessions[0].threads.map((res) => {
//     console.log(res.messages.slice(1));
//     return { ...res, messages: res.messages.slice(1) };
//     // return {...res ,messages:res.messages.slice(1)};
//   });
//   return sessions;
// };

// const welecomeChat = async (userId) => {
//   const conversationId = uuidv4();
//   const topicColor = await getRandomColor();
//   const threadId = uuidv4();
//   let coach_prompt = "";
//   coach_prompt = await globalPrompt.find({});
//   coach_prompt = coach_prompt[0].prompt;
//   coach_prompt = coach_prompt.replace(/{topicName}/g, "different topics");
//   coach_prompt = coach_prompt.replace(/{subtopic}/g, "different subtopics");
//   const newConverstaion = await chatSession.create({
//     userId: userId,
//     startTime: Date.now(),
//     timeSpent: 5000,
//     lastTime: Date.now(),
//     chatType: "topic",
//     conversationId,
//     activeThread: threadId,
//     topic: "Welcome to Coach Chat",
//     subtopic: "Welcome to Coach Chat",
//     color: topicColor,
//     wlType: true,
//     threads: [
//       {
//         threadId: threadId,
//         threadName: "Welcome to Coach Chat",
//         messages: [
//           {
//             role: "system",
//             content: coach_prompt,
//           },
//           {
//             role: "assistant",
//             content:
//               "Welcome to Coach Chat! We are here to help you achieve your goals. Let us know what topics you are interested in.",
//           },
//         ],
//       },
//     ],
//   });
//   return newConverstaion;
// };

// const coachSimilaritySearch = async (conversationTopic, threadIndex, query) => {
//   const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
//   let completionData = await openai.embeddings.create({
//     model: "text-embedding-ada-002",
//     input: query,
//   });
//   const results = await similaritySearch(
//     completionData.data[0].embedding,
//     conversationTopic.namespace
//   );
//   conversationTopic.threads[threadIndex].messages[0].content =
//     conversationTopic.threads[threadIndex].messages[0].content.replace(
//       /{match_content}/g,
//       results
//     );
//   return conversationTopic;
// };

// module.exports = {
//   createConversation,
//   updateConversation,
//   getConversationById,
//   getGlobalConversationState,
//   createGlobalConversationState,
//   updateGlobalConversationState,
//   createConversationThread,
//   updateConversationThread,
//   currentConversation,
//   getUserSession,
//   getConversationByTopic,
//   formatPrompt,
//   getPromptByTopic,
//   welecomeChat,
//   coachSimilaritySearch,
// };
