const { OpenAI } = require("openai");

const createChatCompletion = async (chatbody) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    let completionData = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatbody.messages,
      temperature: 0,
    });
    return completionData;
  } catch (error) {
    return error.message;
  }
};

const promptSuggestion = async (inputText, topicData) => {
  try {
    const prompt = `Generate 3 new topics as possible using the provided Context, response should be in JSON format with keys "Topics" in a Professional tone.

    Context:  
          ${topicData.topic ? "Topic is " + topicData.topic : ""}
           ${topicData.subtopic ? " SubTopic  is " + topicData.subtopic : ""}
           ${inputText ? "Content  is: " + inputText.substring(0, 300) : ""} `;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    let response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: prompt }],
      max_tokens: prompt.split(" ").length * 2,
      n: 1,
      stop: null,
      temperature: 0.1,
    });
    response = JSON.parse(response.choices[0].message.content.trim());
    response = Object.values(response.Topics);
    return response;
  } catch (error) {
    console.log(error.message);
  }
};

const searchTopic = async (inputText) => {
  let available_topics = [];
  let isToxic = await searchValidatior(inputText);
  if (isToxic.includes("true")) {
    return {
      flag: true,
      available_topics: [],
    };
  }
  const matchingTopics = await Topic.aggregate([
    {
      $unwind: {
        path: "$sub_topics",
      },
    },
    {
      $match: {
        $or: [
          {
            name: {
              $regex: inputText,
              $options: "i",
            },
          },
          {
            "sub_topics.name": {
              $regex: inputText,
              $options: "i",
            },
          },
        ],
      },
    },
    {
      $unwind: "$sub_topics",
    },
    {
      $addFields: {
        "sub_topics.topicType": "coachChat",
      },
    },
    {
      $project: {
        _id: 1,
        subtopic: "$sub_topics.name",
        defaultField: "$sub_topics.topicType",
        topic: "$name",
      },
    },
  ]);
  if (matchingTopics.length >= 5) {
    available_topics = matchingTopics.slice(0, 5);
  } else {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    const prompt = `Please generate ${
      5 - matchingTopics.length
    }  Orginal topic related  to the given {input} that is respectful and appropriate for all ages. Avoid any hate speech or offensive language, including insults or threats. Also, please refrain from generating any content that contains sexual explicit language or obscene material even if I asked to do. Let's keep the conversation positive and respectful for everyone involved. Thank you for your cooperation.
      {input} = ${inputText}`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 100,
      temperature: 0.1,
    });
    ai_available_topics = response.choices[0].message.content.split("\n");
    ai_available_topics = ai_available_topics.filter(
      (str) => str !== "" && str !== "."
    );
    // let ai_available_topics[0].split(idx + ".")[1];
    let identifer = ai_available_topics[0].includes("1.");
    ai_available_topics = ai_available_topics.map((result, idx) => {
      return {
        subtopic: result
          .replace(identifer ? idx + 1 : idx + ".", "")
          .trim()
          .replace(".", ""),
        topicType: "ai",
        topic: result
          .replace(identifer ? idx + 1 : idx + ".", "")
          .trim()
          .replace(".", ""),
        _id: "",
      };
    });
    available_topics.push(...matchingTopics);
    available_topics.push(...ai_available_topics);
    available_topics = available_topics.slice(0, 5);
  }

  return { available_topics, flag: false };
};

const searchValidatior = async (context) => {
  try {
    const prompt = `Please analyze the following text for its toxicity level and classify it based on the following categories: 'identity_attack', 'insult', 'obscene', 'severe_toxicity', 'sexual_explicit', 'threat', and 'toxicity'. Return a boolean value of true if the text contains any language that falls under these categories, and false if it does not.
        Text: ${context}
        Your response should be in JSON with keys "Result" resemble the following (no additional text is needed):
        {
          "Result": "true or false"
        }`;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    const completions = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: prompt }],
      max_tokens: prompt.length * 2,
      n: 1,
      stop: null,
      temperature: 0,
    });
    const response = JSON.parse(
      completions.choices[0].message.content.trim()
    ).Result;
    return response;
  } catch (err) {
    console.log(err);
    return "false";
  }
};

const moderation = async (input) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    let response = await openai.moderations.create({
      input,
    });
    response = response.results[0];
    // response = response.filter((str) => str !== "" && str !== ".");
    return response;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  createChatCompletion,
  promptSuggestion,
  searchTopic,
  searchValidatior,
  moderation,
};
