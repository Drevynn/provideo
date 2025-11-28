const express = require('express');
const router = express.Router();
const VideoGenerationService = require('../services/videoGenerator');

// Simple in-memory storage (you can upgrade to a database later)
let clients = [];
let projects = [];
let communications = [];

// Client Management Routes

// Get all clients
router.get('/', (req, res) => {
  res.json({
    success: true,
    clients: clients.map(client => ({
      ...client,
      totalProjects: projects.filter(p => p.clientId === client.id).length,
      totalSpent: projects
        .filter(p => p.clientId === client.id)
        .reduce((sum, p) => sum + (p.totalCost || 0), 0)
    }))
  });
});

// Add new client
router.post('/', (req, res) => {
  const { name, email, phone, company, notes } = req.body;
  
  const newClient = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    company,
    notes,
    status: 'lead', // lead, active, completed, inactive
    createdAt: new Date(),
    lastContact: new Date()
  };
  
  clients.push(newClient);
  
  res.json({
    success: true,
    message: 'Client added successfully',
    client: newClient
  });
});

// Update client
router.put('/:id', (req, res) => {
  const clientId = req.params.id;
  const updates = req.body;
  
  const clientIndex = clients.findIndex(c => c.id === clientId);
  if (clientIndex === -1) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  
  clients[clientIndex] = { ...clients[clientIndex], ...updates, updatedAt: new Date() };
  
  res.json({
    success: true,
    message: 'Client updated successfully',
    client: clients[clientIndex]
  });
});

// Get client details with projects
router.get('/:id', (req, res) => {
  const clientId = req.params.id;
  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  
  const clientProjects = projects.filter(p => p.clientId === clientId);
  const clientCommunications = communications.filter(c => c.clientId === clientId);
  
  res.json({
    success: true,
    client: {
      ...client,
      projects: clientProjects,
      communications: clientCommunications,
      totalSpent: clientProjects.reduce((sum, p) => sum + (p.totalCost || 0), 0)
    }
  });
});

// Project Management Routes

// Create new project
router.post('/:clientId/projects', async (req, res) => {
  const { clientId } = req.params;
  const { title, description, requirements, budget, deadline, videoSpecs } = req.body;
  
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  
  const project = {
    id: Date.now().toString(),
    clientId,
    title,
    description,
    requirements,
    budget,
    deadline: new Date(deadline),
    videoSpecs: {
      duration: videoSpecs?.duration || 30,
      style: videoSpecs?.style || 'cinematic',
      provider: videoSpecs?.provider || 'stabilityai',
      prompt: videoSpecs?.prompt || ''
    },
    status: 'pending', // pending, in-progress, review, completed, cancelled
    createdAt: new Date(),
    payments: [],
    videos: []
  };
  
  projects.push(project);
  
  // Update client status to active
  const clientIndex = clients.findIndex(c => c.id === clientId);
  clients[clientIndex].status = 'active';
  clients[clientIndex].lastContact = new Date();
  
  res.json({
    success: true,
    message: 'Project created successfully',
    project
  });
});

// Generate video for project
router.post('/:clientId/projects/:projectId/generate-video', async (req, res) => {
  const { clientId, projectId } = req.params;
  const { prompt, overrideSpecs } = req.body;
  
  const project = projects.find(p => p.id === projectId && p.clientId === clientId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  
  try {
    const videoService = new VideoGenerationService();
    const specs = { ...project.videoSpecs, ...overrideSpecs };
    
    const result = await videoService.generateVideo(prompt || project.videoSpecs.prompt, {
      provider: specs.provider,
      duration: specs.duration,
      style: specs.style,
      clientId,
      projectId
    });
    
    // Add video to project
    const video = {
      id: Date.now().toString(),
      prompt: prompt || project.videoSpecs.prompt,
      result,
      createdAt: new Date(),
      status: result.status || 'completed'
    };
    
    const projectIndex = projects.findIndex(p => p.id === projectId);
    projects[projectIndex].videos.push(video);
    projects[projectIndex].status = 'in-progress';
    
    res.json({
      success: true,
      message: 'Video generation started',
      video,
      estimatedCost: result.cost
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Video generation failed',
      error: error.message
    });
  }
});

// Communication tracking
router.post('/:clientId/communications', (req, res) => {
  const { clientId } = req.params;
  const { type, subject, notes, followUpDate } = req.body;
  
  const communication = {
    id: Date.now().toString(),
    clientId,
    type, // call, email, meeting, note
    subject,
    notes,
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    createdAt: new Date()
  };
  
  communications.push(communication);
  
  // Update client last contact
  const clientIndex = clients.findIndex(c => c.id === clientId);
  if (clientIndex !== -1) {
    clients[clientIndex].lastContact = new Date();
  }
  
  res.json({
    success: true,
    message: 'Communication logged',
    communication
  });
});

module.exports = router;
