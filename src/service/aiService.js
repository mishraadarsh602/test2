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
    if (!response?.usage || !appId) {
      console.log('Missing required parameters for logging Anthropic tokens');
      return;
    }

    try {
      const { model, usage: { input_tokens, output_tokens } } = response;
      return await this._updateOrCreateLog({
        appId,
        model,
        aiInputToken: input_tokens,
        aiOutputToken: output_tokens,
        aiTotalToken: input_tokens + output_tokens
      });
    } catch (error) {
      console.log('Error logging Anthropic tokens:', error);
     
    }
  }

  async logOpenAITokens({ model, appId, aiInputToken, aiOutputToken, aiTotalToken }) {
    if (!model || !appId) {
      throw new Error('Missing required parameters for logging OpenAI tokens');
    }
    try {
      return await this._updateOrCreateLog({
        appId,
        model,
        aiInputToken,
        aiOutputToken,
        aiTotalToken
      });
    } catch (error) {
      console.log('Error logging OpenAI tokens:', error);
    }
  }

  async _updateOrCreateLog({ appId, model, aiInputToken, aiOutputToken, aiTotalToken }) {
    const existingLog = await AiTempLog.findOne({ appId, model });
    if (existingLog) {
      return await AiTempLog.findOneAndUpdate(
        { appId, model },
        {
          $inc: {
            aiInputToken,
            aiOutputToken,
            aiTotalToken
          },
        },
        { new: true }
      );
    }

    const aiTempLog = new AiTempLog({
      appId,
      model,
      aiInputToken,
      aiOutputToken,
      aiTotalToken,
    });
    
    return await aiTempLog.save();
  }
}

module.exports = new AiService();