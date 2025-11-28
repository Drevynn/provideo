const axios = require('axios');

class VideoGenerationService {
  constructor() {
    this.providers = {
      // Stable Video Diffusion (more affordable)
      stabilityai: {
        baseURL: 'https://api.stability.ai',
        costPerVideo: 0.50, // Estimated cost
        maxDuration: 4 // seconds
      },
      // Pika Labs (reasonable pricing)
      pika: {
        baseURL: 'https://api.pika.art',
        costPerVideo: 1.00,
        maxDuration: 10
      },
      // RunwayML (premium but high quality)
      runway: {
        baseURL: 'https://api.runwayml.com',
        costPerVideo: 5.00,
        maxDuration: 16
      }
    };
  }

  async generateVideo(prompt, options = {}) {
    const {
      provider = 'stabilityai',
      duration = 4,
      style = 'cinematic',
      clientId,
      projectId
    } = options;

    try {
      console.log(`Generating video with ${provider} for client ${clientId}`);
      
      // Log the request for billing
      await this.logVideoRequest(clientId, provider, this.providers[provider].costPerVideo);

      switch (provider) {
        case 'stabilityai':
          return await this.generateWithStability(prompt, { duration, style });
        case 'pika':
          return await this.generateWithPika(prompt, { duration, style });
        case 'runway':
          return await this.generateWithRunway(prompt, { duration, style });
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  }

  async generateWithStability(prompt, options) {
    const response = await axios.post(
      `${this.providers.stabilityai.baseURL}/v1/generation/stable-video-diffusion-xl/text-to-video`,
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        motion_bucket_id: 127,
        seed: 0,
        steps: 25
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      videoUrl: response.data.artifacts[0].base64,
      provider: 'stabilityai',
      cost: this.providers.stabilityai.costPerVideo,
      duration: options.duration
    };
  }

  async generateWithRunway(prompt, options) {
    const response = await axios.post(
      `${this.providers.runway.baseURL}/v1/tasks`,
      {
        taskType: 'gen3a_turbo',
        internal: false,
        options: {
          text_prompt: prompt,
          duration: options.duration,
          exploreMode: false,
          watermark: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      taskId: response.data.task.id,
      provider: 'runway',
      cost: this.providers.runway.costPerVideo,
      status: 'processing'
    };
  }

  async logVideoRequest(clientId, provider, cost) {
    const logEntry = {
      clientId,
      provider,
      cost,
      timestamp: new Date(),
      status: 'initiated'
    };
    
    console.log('Video generation logged:', logEntry);
    return logEntry;
  }

  getProviderCosts() {
    return Object.entries(this.providers).map(([name, config]) => ({
      name,
      costPerVideo: config.costPerVideo,
      maxDuration: config.maxDuration
    }));
  }
}

module.exports = VideoGenerationService;
