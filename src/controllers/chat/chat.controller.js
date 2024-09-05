// const httpStatus = require("http-status");
// const {
//   chatCompletionService,
//   chatSessionService,
// } = require("../../services/chat");
// const { User } = require("../../models/client");

// const promptSuggestion = catchAsync(async (req, res) => {
//   const { value, topicData } = req.body;
//   const suggestions = await chatCompletionService.promptSuggestion(
//     value,
//     topicData
//   );
//   return res.status(httpStatus.CREATED).json({ suggestions });
// });

// const getTopics = catchAsync(async (req, res) => {
//   const getTopics = await Topic.find({}, { prompt: 0 });
//   return res.status(httpStatus.CREATED).json({ available_topics: getTopics });
// });

// const getWebsiteTopics = catchAsync(async (req, res) => {
//   const getTopics = await Topic.find(
//     { type: "topic" },
//     { name: 1, imageUrl: 1, type: 1, "sub_topics.name": 1, _id: 0 }
//   );
//   return res.status(httpStatus.CREATED).json({ available_topics: getTopics });
// });

// const searchTopic = catchAsync(async (req, res) => {
//   const { value } = req.body;
//   // console.log(req.body);
//   const result = await chatCompletionService.searchTopic(value);
//   return res.status(httpStatus.CREATED).json({ result: result });
// });
// const chatSession = catchAsync(async (req, res) => {
//   const chatSessions = await chatSessionService.getUserSession(req.user_id);
//   return res.status(httpStatus.OK).json({ chatSessions });
// });

// const globalSession = catchAsync(async (req, res) => {
//   const globalSession = await chatSessionService.getGlobalConversationState(
//     req.user_id
//   );
//   return res.status(httpStatus.OK).json({ globalSession });
// });

// const currentSession = catchAsync(async (req, res) => {
//   const currentSession = await chatSessionService.currentConversation(
//     req.user_id
//   );
//   return res.status(httpStatus.OK).json({ currentSession });
// });
// const getConversation = catchAsync(async (req, res) => {
//   const conversation = await chatSessionService.getConversationById(
//     req.user_id,
//     req.params.conversationId,
//     false
//   );
//   return res.status(httpStatus.OK).json({ conversation });
// });

// const emailTranscript = catchAsync(async (req, res) => {
//   const conversation = await chatSessionService.getConversationById(
//     req.user_id,
//     req.body.activeConversationId,
//     false
//   );
//   const user_data = await User.findOne({ _id: req.user_id });
//   let lines = [];
//   for (let i = 0; i < conversation.threads.length; i++) {
//     lines.push("Thread Name: ", conversation.threads[i].threadName);
//     for (let j = 0; j < conversation.threads[i].messages.length; j++) {
//       if (conversation.threads[i].messages[j].role == "assistant") {
//         lines.push("CoachChat: ", conversation.threads[i].messages[j].content);
//       } else {
//         lines.push("You: ", conversation.threads[i].messages[j].content);
//       }
//     }
//   }
//   console.log(lines);
//   await emailService.sendEmailRequestChatTranscript(
//     user_data,
//     lines,
//     req.body.activeConversationId
//   );
//   return res.status(httpStatus.OK).json({ msg: "done" });
// });

// const checkTopicChatLimit = catchAsync(async (req, res) => {
//   let bodyData = req.body;
//   let resObj = { flag: false, timeflag: false };
//   const chatLimit = await chatSessionService.getConversationByTopic(
//     req.user_id,
//     bodyData
//   );
//   if (chatLimit) {
//     const Subscriptions = await Subscription.find({ userId: req.user_id });
//     const currentDate = new Date();
//     if (
//       currentDate.getDate() == new Date(chatLimit.timeSpentDate).getDate() &&
//       chatLimit.dayTimeSpent > 10 * 60 * 1000 &&
//       (Subscriptions[0].plan_id == "free_m" ||
//         Subscriptions[0].subscription_detail.status == "trial" ||
//         Subscriptions[0].subscription_detail.status == "trial_expired")
//     ) {
//       resObj["timeflag"] = true;
//     }
//   }
//   resObj["message"] = "Limit checked Successfully!";
//   if (!chatLimit) {
//     resObj["flag"] = true;
//   }
//   return res.status(httpStatus.OK).json(resObj);
// });

// module.exports = {
//   promptSuggestion,
//   getTopics,
//   searchTopic,
//   chatSession,
//   globalSession,
//   currentSession,
//   getConversation,
//   getWebsiteTopics,
//   checkTopicChatLimit,
//   emailTranscript,
// };
