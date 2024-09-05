// const { chatStream } = require("../../services/chat/chatStream.Service");
// const { Topic } = require("../../models/topic");
const {chatSessionService, chatCompletionService } = require("../../service/chat/index")

module.exports = (app, server) => {
  const socketIo = require("socket.io");
  const io = socketIo(server, {
    secure: false,
    cors: {
      origin: [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
      ],
      credentials: true,
    },
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  });
  io.on("connection", (socket) => {
    console.log("socket connection : ", socket.id);
    // socket.emit('message', 'Hello from the server!');
    // socket.on("joinConversation", async (data) => {
    //   let conversationTopic;
    //   const conversationId = data.conversationId;
    //   const userId = data.userId;

    //   // if (conversationId == "") {
    //   //   conversationTopic = await chatSessionService.getConversationByTopic(
    //   //     userId,
    //   //     data.topicData
    //   //   );
    //   // } else {
    //     conversationTopic = await chatSessionService.getConversationById(
    //       userId,
    //       conversationId
    //     );
    //   // }
    //   let userConversationState =await chatSessionService.getGlobalConversationState(userId);
    //   if (conversationTopic) {
    //     conversationTopic = await chatSessionService.updateConversation(
    //       conversationTopic.conversationId,
    //       {
    //         lastTime: Date.now(),
    //       }
    //     );
    //   } else {
    //     conversationTopic = await chatSessionService.createConversation(
    //       userId,
    //       data.topicData
    //     );
    //     let pastMessages = conversationTopic.messages.map((res) => {
    //       return { role: res.role, content: res.content };
    //     });
    //     const response = await chatCompletionService.createChatCompletion({
    //       messages: pastMessages,
    //     });
    //     // conversationTopic = await chatSessionService.updateConversationThread(
    //     //   [response.data.choices[0].message]
    //     // );
    //     // if (!userConversationState) {
    //     //   chatSessionService.createGlobalConversationState(
    //     //     userId,
    //     //     conversationTopic._id
    //     //   );
    //     // } else {
    //     //   chatSessionService.updateGlobalConversationState(userId, {
    //     //     $push: { chatsessions: conversationTopic._id },
    //     //     $set: { timeSpent: userConversationState.timeSpent + 5000 },
    //     //   });
    //     // }
    //   }
    //   //conversation timing user spent
    //   const idleTime = 30 * 60 * 1000;
    //   conversationStartTime = Date.now();
    //   const idleConversationInterval = setInterval(async () => {
    //     try {
    //       conversationTopic = await chatSessionService.getConversationById(
    //         userId,
    //         conversationTopic.conversationId
    //       );
    //       const currentTime = Date.now();
    //       if (conversationTopic.lastTime === null) {
    //         return;
    //       }
    //       const differenceTime =
    //         currentTime - new Date(conversationTopic.lastTime).getTime();
    //       if (differenceTime >= idleTime) {
    //         clearInterval(idleConversationInterval);
    //         // const conversation = await chatSessionService.getConversationById(
    //         //   userId,
    //         //   conversationId
    //         // );
    //         const conversationLastTime = Date.now();
    //         // const timeSpent =
    //         //   conversation.timeSpent +
    //         //   (Date.now() - new Date(conversation.lastTime).getTime()) -
    //         //   idleTime;
    //         await chatSessionService.updateConversation(
    //           conversationTopic.conversationId,
    //           {
    //             lastTime: conversationLastTime,
    //           }
    //         );
    //         // await chatSessionService.updateGlobalConversationState(userId, {
    //         //   timeSpent:
    //         //     conversationTopic.timeSpent +
    //         //     (currentTime -
    //         //       new Date(conversationTopic.conversationLastTime).getTime()),
    //         // });
    //         socket.emit("session-disconnect", "connection-disconect");
    //         socket.disconnect();
    //       }
    //     } catch (error) {
    //       clearInterval(idleConversationInterval);
    //       socket.emit("session-disconnect", "connection-disconect");
    //       socket.disconnect();
    //     }
    //   }, idleTime);
    //   conversationTopic.threads = conversationTopic.threads.map((res) => {
    //     // console.log(res.messages.slice(1));
    //     return { ...res, messages: res.messages.slice(1) };
    //     // return {...res ,messages:res.messages.slice(1)};
    //   });

    //   socket.emit("session-pinged", {
    //     conversationId: conversationTopic.conversationId,
    //     threadId: conversationTopic.activeThread,
    //     threads: conversationTopic.threads,
    //     activeThread: conversationTopic.threads[cn_thread_idx],
    //     messages: conversationTopic.threads[cn_thread_idx].messages,
    //     sessionMx: "session-pinged",
    //   });
    // });
    socket.on('disconnect', () => {
      console.log('🔥: A user disconnected');
    });
    // socket.on("joinConversationStream", async (data) => {
    //   let conversationTopic;
    //   let cn_thread_idx = 0;
    //   const { conversationId, userId } = data;
    //   const userConversationState =
    //     await chatSessionService.getGlobalConversationState(userId);
    //   const Subscriptions = await Subscription.find({ userId });

    //   if (conversationId == "") {
    //     conversationTopic = await chatSessionService.getConversationByTopic(
    //       userId,
    //       data.topicData
    //     );
    //   } else {
    //     conversationTopic = await chatSessionService.getConversationById(
    //       userId,
    //       conversationId
    //     );
    //   }
    //   if (
    //     userConversationState &&
    //     userConversationState.chatsessions.length >= 3 &&
    //     !userConversationState.chatsessions.includes(conversationTopic?._id) &&
    //     (Subscriptions[0].plan_id == "free_m" ||
    //       Subscriptions[0].subscription_detail.status == "trial" ||
    //       Subscriptions[0].subscription_detail.status == "trial_expired")
    //   ) {
    //     socket.emit("session-exceed", {
    //       message: "Session Exceed Please Upgrade plan!",
    //       flag: true,
    //     });
    //     return;
    //   }
    //   if (conversationTopic) {
    //     const Subscriptions = await Subscription.find({ userId });
    //     const currentDate = new Date();
    //     if (
    //       currentDate.getDate() !=
    //       new Date(conversationTopic.timeSpentDate).getDate()
    //     ) {
    //       chatSessionService.updateConversation(
    //         conversationTopic.conversationId,
    //         { timeSpentDate: new Date(), dayTimeSpent: 0 }
    //       );
    //     } else if (
    //       conversationTopic.dayTimeSpent > 10 * 60 * 1000 &&
    //       (Subscriptions[0].plan_id == "free_m" ||
    //         Subscriptions[0].subscription_detail.status == "trial" ||
    //         Subscriptions[0].subscription_detail.status == "trial_expired")
    //     ) {
    //       socket.emit("plan-exceed", {
    //         message: "Time Spent  Exceed Please Upgrade plan!",
    //         flag: true,
    //       });
    //       return;
    //     }
    //     conversationTopic = await chatSessionService.updateConversation(
    //       conversationTopic.conversationId,
    //       {
    //         lastTime: Date.now(),
    //       }
    //     );
    //     cn_thread_idx = conversationTopic.threads.findIndex((res) => {
    //       return res.threadId == conversationTopic.activeThread;
    //     });
    //     conversationTopic.threads = conversationTopic.threads.map((res) => {
    //       return { ...res, messages: res.messages.slice(1) };
    //     });
    //     socket.emit("session-pinged-stream", {
    //       streamEndflag: false,
    //       isStream: false,
    //       conversationId: conversationTopic.conversationId,
    //       threadId: conversationTopic.activeThread,
    //       threads: conversationTopic.threads,
    //       activeThread: conversationTopic.threads[cn_thread_idx],
    //       messages: conversationTopic.threads[cn_thread_idx].messages,
    //       sessionMx: "session-pinged",
    //     });
    //   } else {
    //     conversationTopic = await chatSessionService.createConversation(
    //       userId,
    //       data.topicData
    //     );
    //     // if (data.topicData.chatType == "coach") {
    //     //   const prompt = await globalPrompt.find({});
    //     //   let coach_welcome_msg = prompt[0].coachWelcomeMessage;
    //     //   coach_welcome_msg = coach_welcome_msg.replace(
    //     //     /{coachname}/g,
    //     //     conversationTopic.topic
    //     //   );
    //     //   conversationTopic = await chatSessionService.coachSimilaritySearch(
    //     //     conversationTopic,
    //     //     0,
    //     //     coach_welcome_msg
    //     //   );
    //     //   conversationTopic.threads[cn_thread_idx].messages.push({
    //     //     role: "user",
    //     //     content: coach_welcome_msg,
    //     //   });
    //     // }
    //     let pastMessages = conversationTopic.threads[0].messages.map((res) => {
    //       return { role: res.role, content: res.content };
    //     });
    //     conversationTopic.threads = conversationTopic.threads.map((res) => {
    //       return { ...res, messages: res.messages.shift() };
    //     });
    //     conversationTopic.threads[0].messages.pop();
    //     try {
    //       let modelType = "gpt-3.5-turbo-0613";
    //       if (conversationTopic?.topicId && conversationTopic?.topicId.length) {
    //         const matchingTopic = await Topic.findById(
    //           conversationTopic?.topicId
    //         );
    //         if (matchingTopic.useGPT4Prompt) {
    //           modelType = "gpt-4";
    //         }
    //       } else {
    //         const globalPromptData = await globalPrompt.find({});
    //         if (globalPromptData[0].useGPT4Prompt) {
    //           modelType = "gpt-4";
    //         }
    //       }
    //       await chatStream(
    //         pastMessages,
    //         async (streamData) => {
    //           socket.emit("session-pinged-stream", {
    //             streamEndflag: streamData.streamEndflag,
    //             isStream: true,
    //             conversationId: conversationTopic.conversationId,
    //             threadId: conversationTopic.activeThread,
    //             threads: conversationTopic.threads,
    //             activeThread: conversationTopic.threads[cn_thread_idx],
    //             messages: streamData.content,
    //             sessionMx: "session-pinged",
    //             errorFlag: streamData.errorFlag,
    //           });
    //           if (!streamData.errorFlag && streamData.streamEndflag) {
    //             conversationTopic =
    //               await chatSessionService.updateConversationThread(
    //                 conversationTopic.threads[0].threadId,
    //                 [{ role: "assistant", content: streamData.finalOutput }]
    //               );
    //             const userConversationState =
    //               await chatSessionService.getGlobalConversationState(userId);
    //             if (!userConversationState) {
    //               chatSessionService.createGlobalConversationState(
    //                 userId,
    //                 conversationTopic._id
    //               );
    //             } else {
    //               chatSessionService.updateGlobalConversationState(userId, {
    //                 $push: { chatsessions: conversationTopic._id },
    //                 $set: {
    //                   timeSpent: userConversationState.timeSpent + 5000,
    //                   dayTimeSpent: userConversationState.dayTimeSpent + 5000,
    //                 },
    //               });
    //             }
    //           }
    //         },
    //         modelType
    //       );
    //     } catch (error) {
    //       console.log(error);
    //     }
    //   }
    //   //conversation timing user spent
    //   const idleTime = 30 * 60 * 1000;
    //   conversationStartTime = Date.now();
    //   const idleConversationInterval = setInterval(async () => {
    //     try {
    //       // const used = process.memoryUsage().heapUsed / 1024 / 1024;
    //       // console.log(
    //       //   `The heap size is approximately ${Math.round(used * 100) / 100} MB`
    //       // );

    //       conversationTopic = await chatSessionService.getConversationById(
    //         userId,
    //         conversationTopic.conversationId
    //       );
    //       const currentTime = Date.now();
    //       if (conversationTopic.lastTime === null) {
    //         return;
    //       }
    //       const differenceTime =
    //         currentTime - new Date(conversationTopic.lastTime).getTime();
    //       if (differenceTime >= idleTime) {
    //         clearInterval(idleConversationInterval);
    //         // const conversation = await chatSessionService.getConversationById(
    //         //   userId,
    //         //   conversationId
    //         // );
    //         const conversationLastTime = Date.now();
    //         // const timeSpent =
    //         //   conversation.timeSpent +
    //         //   (Date.now() - new Date(conversation.lastTime).getTime()) -
    //         //   idleTime;
    //         // await chatSessionService.updateConversation(
    //         //   conversationTopic.conversationId,
    //         //   {
    //         //     lastTime: conversationLastTime,
    //         //   }
    //         // );
    //         // await chatSessionService.updateGlobalConversationState(userId, {
    //         //   timeSpent:
    //         //     conversationTopic.timeSpent +
    //         //     (currentTime -
    //         //       new Date(conversationTopic.conversationLastTime).getTime()),
    //         // });
    //         socket.emit("session-disconnect", "connection-disconect");
    //         socket.disconnect();
    //       }
    //     } catch (error) {
    //       clearInterval(idleConversationInterval);
    //       socket.emit("session-disconnect", "connection-disconect");
    //       socket.disconnect();
    //     }
    //   }, idleTime);
    // });
    // socket.on("messageStream", async (data) => {
    //   const { userId, conversationId, threadId } = data;
    //   let conversationTopic = await chatSessionService.getConversationById(
    //     userId,
    //     conversationId
    //   );
    //   const Subscriptions = await Subscription.find({ userId });
    //   const currentDate = new Date();
    //   if (
    //     currentDate.getDate() !=
    //     new Date(conversationTopic.timeSpentDate).getDate()
    //   ) {
    //     await chatSessionService.updateConversation(
    //       conversationTopic.conversationId,
    //       { timeSpentDate: new Date(), dayTimeSpent: 0 }
    //     );
    //   } else if (
    //     conversationTopic.dayTimeSpent > 10 * 60 * 1000 &&
    //     (Subscriptions[0].plan_id == "free_m" ||
    //       Subscriptions[0].subscription_detail.status == "trial" ||
    //       Subscriptions[0].subscription_detail.status == "trial_expired")
    //   ) {
    //     socket.emit("plan-exceed", {
    //       message: "Time Spent  Exceed Please Upgrade plan!",
    //       flag: true,
    //     });
    //     return;
    //   }
    //   console.log(conversationTopic._id);
    //   if (conversationTopic.lastTime == null) {
    //     conversationTopic.lastTime = Date.now();
    //   }
    //   const idledifferenceTime =
    //     Date.now() - new Date(conversationTopic.lastTime).getTime();
    //   if (idledifferenceTime >= 720000) {
    //     conversationTopic.lastTime = Date.now();
    //   }

    //   const cn_thread_idx = conversationTopic.threads.findIndex((res) => {
    //     return res.threadId == threadId;
    //   });
    //   // console.log(conversationTopic.threads[cn_thread_idx]);
    //   if (conversationTopic.chatType == "coach") {
    //     conversationTopic = await chatSessionService.coachSimilaritySearch(
    //       conversationTopic,
    //       cn_thread_idx,
    //       data.message[0].content
    //     );
    //   }
    //   let pastMessages = conversationTopic.threads[cn_thread_idx].messages.map(
    //     (res) => {
    //       return { role: res.role, content: res.content };
    //     }
    //   );
    //   let user_message = Object.assign({}, data.message[0]);
    //   let deviate_message = await globalPrompt.find({});
    //   deviate_message = deviate_message[0].deviatePrompt;
    //   if (pastMessages.length > 13) {
    //     const firstMessaages = pastMessages.slice(0, 3);
    //     const lastMessaages = pastMessages.slice(-6);
    //     pastMessages = firstMessaages.concat(lastMessaages);
    //   }
    //   if (pastMessages.length > 2 && conversationTopic.chatType != "coach") {
    //     pastMessages.splice(pastMessages.length - 1, 0, ...deviate_message);
    //   } else if (conversationTopic.chatType == "coach") {
    //     pastMessages.push({
    //       role: "user",
    //       content: "never answer out of  my specialzation or coach context",
    //     });
    //   }
    //   pastMessages.push(user_message);
    //   try {
    //     let modelType = "gpt-3.5-turbo-0613";
    //     if (conversationTopic?.topicId && conversationTopic?.topicId.length) {
    //       const matchingTopic = await Topic.findById(
    //         conversationTopic?.topicId
    //       );
    //       if (matchingTopic.useGPT4Prompt) {
    //         modelType = "gpt-4";
    //       }
    //     } else {
    //       const globalPromptData = await globalPrompt.find({});
    //       if (globalPromptData[0].useGPT4Prompt) {
    //         modelType = "gpt-4";
    //       }
    //     }
    //     chatStream(
    //       pastMessages,
    //       async (streamData) => {
    //         socket.emit("response-stream", {
    //           streamEndflag: streamData.streamEndflag,
    //           conversationId: conversationTopic.conversationId,
    //           chatId: conversationTopic._id,
    //           threadId: conversationTopic.activeThread,
    //           threads: conversationTopic.threads,
    //           activeThread: conversationTopic.threads[cn_thread_idx],
    //           messages: streamData.content,
    //           errorFlag: streamData.errorFlag,
    //         });
    //         if (!streamData.errorFlag && streamData.streamEndflag) {
    //           const currentTime = Date.now();
    //           const readTime = streamData.finalOutput.length * 0.04;
    //           const differenceTime =
    //             currentTime - new Date(conversationTopic.lastTime).getTime();
    //           await chatSessionService.updateConversation(conversationId, {
    //             lastTime: currentTime,
    //             timeSpent:
    //               conversationTopic.timeSpent + differenceTime + readTime,
    //             dayTimeSpent:
    //               conversationTopic.dayTimeSpent + differenceTime + readTime,
    //           });
    //           const newMessages = [
    //             data.message[0],
    //             { role: "assistant", content: streamData.finalOutput },
    //           ];
    //           conversationTopic =
    //             await chatSessionService.updateConversationThread(
    //               threadId,
    //               newMessages
    //             );
    //           let userConversationState =
    //             await chatSessionService.getGlobalConversationState(userId);
    //           await chatSessionService.updateGlobalConversationState(userId, {
    //             $set: {
    //               timeSpent:
    //                 userConversationState.timeSpent + differenceTime + readTime,
    //             },
    //           });
    //           let moderationContent = await chatCompletionService.moderation(
    //             streamData.finalOutput
    //           );
    //           if (moderationContent?.flagged) {
    //             const Flags = [];
    //             for (const [flag, value] of Object.entries(
    //               moderationContent.categories
    //             )) {
    //               if (value === true) {
    //                 Flags.push(flag);
    //               }
    //             }

    //             const commaSeparatedFlags = Flags.join(", ");
    //             await chatSessionService.updateGlobalConversationState(userId, {
    //               $set: {
    //                 moderationCount: userConversationState.moderationCount + 1,
    //               },
    //               $push: {
    //                 moderationContent: {
    //                   conversationId: conversationTopic.conversationId,
    //                   flags: commaSeparatedFlags,
    //                   content: data.message[0].content,
    //                 },
    //               },
    //             });
    //           }
    //         }
    //       },
    //       modelType
    //     );
    //   } catch (error) {
    //     console.log(error);
    //   }
    //   // }, delay);
    // });
    // socket.on("message", async (data) => {
    //   const userId = data.userId;
    //   const conversationId = data.conversationId;
    //   const threadId = data.threadId;
    //   let conversationTopic = await chatSessionService.getConversationById(
    //     userId,
    //     conversationId
    //   );
    //   console.log(conversationTopic._id);
    //   if (conversationTopic.lastTime == null) {
    //     conversationTopic.lastTime = Date.now();
    //   }
    //   const idledifferenceTime =
    //     Date.now() - new Date(conversationTopic.lastTime).getTime();
    //   if (idledifferenceTime >= 720000) {
    //     conversationTopic.lastTime = Date.now();
    //   }

    //   const cn_thread_idx = conversationTopic.threads.findIndex((res) => {
    //     return res.threadId == threadId;
    //   });
    //   // console.log(conversationTopic.threads[cn_thread_idx]);
    //   let pastMessages = conversationTopic.threads[cn_thread_idx].messages.map(
    //     (res) => {
    //       return { role: res.role, content: res.content };
    //     }
    //   );
    //   let user_message = Object.assign({}, data.message[0]);
    //   user_message[
    //     "content"
    //   ] = `Please treat my response as only related to the topic or subtopic or past data. If my response is not related to your question don't deviate from core topic or subtopic.
    //     If it a question then treat my reply as answer to that question else you can decide based on rules and your knowledge.
    //     If my answer is unclear regarding a specific question, please refer to previous relevant questions that closely match my response.
    //     Here is my response:  ${user_message.content}`;
    //   let deviate_message = [
    //     {
    //       role: "user",
    //       content: `Please remember our past conversation. If, as a CoachChat, you will ask a question, treat my reply as an answer. If you didn't get correct answer keep asking question and judge my answer based on that question, until you got proper new topic or correct answer.
    //         Don't deviate from the provided rules and role of the system's message, and apologize if your question is not relevant to the core topic or subtopic, even I ask to do so`,
    //     },
    //     {
    //       role: "assistant",
    //       content: `Thank you for the reminder. I will remember to adhere to the rules and role: system's message and remember our past conversation. And will not deviate from the core topic or subtopic and I will treat your reply as an answer if I asked a question to you. If I do, I will apologize.
    //         I will judge your response based on my previous context`,
    //     },
    //   ];
    //   if (pastMessages.length > 4) {
    //     pastMessages.splice(pastMessages.length - 1, 0, ...deviate_message);
    //   }
    //   // pastMessages.push(...deviate_message);
    //   pastMessages.push(user_message);
    //   //ai response
    //   const response = await chatCompletionService.createChatCompletion({
    //     messages: pastMessages,
    //   });
    //   // console.log(response);
    //   const currentTime = Date.now();
    //   const Output = response.data.choices[0].message;
    //   const readTime = Output.content.length * 0.04;
    //   const differenceTime =
    //     currentTime - new Date(conversationTopic.lastTime).getTime();
    //   await chatSessionService.updateConversation(conversationId, {
    //     lastTime: currentTime,
    //     timeSpent: conversationTopic.timeSpent + differenceTime + readTime,
    //   });
    //   // pastMessages.push(response.data.choices[0].message);
    //   const newMessages = [data.message[0], Output];
    //   conversationTopic = await chatSessionService.updateConversationThread(
    //     threadId,
    //     newMessages
    //   );
    //   let userConversationState =
    //     await chatSessionService.getGlobalConversationState(userId);
    //   await chatSessionService.updateGlobalConversationState(userId, {
    //     $set: {
    //       timeSpent:
    //         userConversationState.timeSpent + differenceTime + readTime,
    //     },
    //   });
    //   // console.log(answer);

    //   socket.emit("chat-response", {
    //     conversationId: conversationTopic.conversationId,
    //     chatId: conversationTopic._id,
    //     threadId: conversationTopic.activeThread,
    //     threads: conversationTopic.threads,
    //     activeThread: conversationTopic.threads[cn_thread_idx],
    //     messages: Output,
    //   });
    // });
    // socket.on("disconnection", async (data) => {
    //   const userId = data.userId;
    //   const conversationId = data.conversationId;
    //   let conversationTopic = await chatSessionService.getConversationById(
    //     userId,
    //     conversationId
    //   );
    //   const currentTime = Date.now();
    //   // await chatSessionService.updateConversation(conversationId, {
    //   //   lastTime: currentTime,
    //   //   timeSpent:
    //   //     conversationTopic.timeSpent +
    //   //     (currentTime - new Date(conversationTopic.lastTime).getTime()),
    //   // });
    //   socket.emit("session-disconnect", "connection-disconect");
    //   socket.disconnect();
    // });
  });
};
