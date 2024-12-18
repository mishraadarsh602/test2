const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const AiTempLog = require('../models/logs/aiTemplogs');

class AiService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env['ANTHROPIC_API_KEY'],
    });
    this.openai = new OpenAI({ 
      apiKey: process.env.OPEN_AI_KEY 
    });
  }

  async logAnthropicTokens(response, { appId }) {
    try {
      const existingLog = await AiTempLog.findOne({ appId, model: response.model });
      console.log("sonnet response11:",response)
      console.log("sonnet input:",response.usage.input_tokens,",output:",response.usage.output_tokens,",totaltoken:",response.usage.input_tokens + response.usage.output_tokens)

      if (existingLog) {
        return await AiTempLog.findOneAndUpdate(
          { appId, model: response.model },
          {
            $inc: {
              aiInputToken: response.usage.input_tokens,
              aiOutputToken: response.usage.output_tokens,
              aiTotalToken: response.usage.input_tokens + response.usage.output_tokens
            },
          },
          { new: true }
        );
      }
  
      const aiTempLog = new AiTempLog({
        appId,
        aiInputToken: response.usage.input_tokens,
        aiOutputToken: response.usage.output_tokens,
        aiTotalToken: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
      });
      
      return await aiTempLog.save();
    } catch (error) {
      console.log('Error logging Anthropic tokens:', error);
    }
  }
  
  async logOpenAITokens({ model, appId, aiInputToken, aiOutputToken, aiTotalToken }) {
    console.log("openai input:",aiInputToken,",output:",aiOutputToken,",totaltoken:",aiTotalToken)
    try {
      const existingLog = await AiTempLog.findOne({ appId, model });
      
      if (existingLog) {
        return await AiTempLog.findOneAndUpdate(
          { appId, model },
          {
            $inc: {
              aiInputToken: aiInputToken,
              aiOutputToken: aiOutputToken,
              aiTotalToken: aiTotalToken
            },
          },
          { new: true }
        );
      }
  
      const aiTempLog = new AiTempLog({
        appId,
        aiInputToken: aiInputToken,
        aiOutputToken: aiOutputToken,
        aiTotalToken: aiTotalToken,
        model,
      });
      
      return await aiTempLog.save();
    } catch (error) {
      console.log('Error logging OpenAI tokens:', error);
    }
  }
}

module.exports = new AiService();