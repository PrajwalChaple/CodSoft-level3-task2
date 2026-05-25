const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all projects of logged in user
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    members: req.user._id,
  })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: projects.length, data: projects });
});

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is a member
  const isMember = project.members.some(
    (member) => member._id.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this project');
  }

  res.json({ success: true, data: project });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { name, description, deadline, color, members } = req.body;

  const project = await Project.create({
    name,
    description,
    deadline,
    color,
    owner: req.user._id,
    members: members || [],
  });

  const populatedProject = await Project.findById(project._id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('project:created', populatedProject);
  }

  res.status(201).json({ success: true, data: populatedProject });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (owner only)
const updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Only owner can update project details
  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can update this project');
  }

  const { name, description, status, deadline, color } = req.body;

  project.name = name || project.name;
  project.description = description !== undefined ? description : project.description;
  project.status = status || project.status;
  project.deadline = deadline !== undefined ? deadline : project.deadline;
  project.color = color || project.color;

  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(project._id.toString()).emit('project:updated', updatedProject);
  }

  res.json({ success: true, data: updatedProject });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owner only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can delete this project');
  }

  // Delete all tasks associated with the project
  await Task.deleteMany({ project: project._id });

  // Delete the project
  await Project.findByIdAndDelete(project._id);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('project:deleted', project._id);
  }

  res.json({ success: true, message: 'Project and associated tasks deleted' });
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (owner only)
const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can add members');
  }

  // Check if already a member
  if (project.members.includes(userId)) {
    res.status(400);
    throw new Error('User is already a member of this project');
  }

  project.members.push(userId);
  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

  res.json({ success: true, data: updatedProject });
});

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (owner only)
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can remove members');
  }

  // Cannot remove the owner
  if (req.params.userId === project.owner.toString()) {
    res.status(400);
    throw new Error('Cannot remove the project owner');
  }

  project.members = project.members.filter(
    (member) => member.toString() !== req.params.userId
  );
  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

  res.json({ success: true, data: updatedProject });
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
