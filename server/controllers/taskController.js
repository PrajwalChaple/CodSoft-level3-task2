const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check membership
  const isMember = project.members.some(
    (member) => member.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view tasks of this project');
  }

  const tasks = await Task.find({ project: req.params.projectId })
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('comments.user', 'name email avatar')
    .sort({ order: 1, createdAt: -1 });

  res.json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Get all tasks assigned to logged in user (across all projects)
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignee: req.user._id })
    .populate('project', 'name color')
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort({ deadline: 1 });

  res.json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('project', 'name color members')
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('comments.user', 'name email avatar');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, data: task });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignee, priority, deadline, tags, status } = req.body;

  // Check project exists
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check membership
  const isMember = projectDoc.members.some(
    (member) => member.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to add tasks to this project');
  }

  // Get the highest order in the column for ordering
  const highestOrder = await Task.findOne({
    project,
    status: status || 'todo',
  }).sort({ order: -1 });

  const task = await Task.create({
    title,
    description,
    project,
    assignee: assignee || null,
    createdBy: req.user._id,
    priority: priority || 'medium',
    deadline,
    tags: tags || [],
    status: status || 'todo',
    order: highestOrder ? highestOrder.order + 1 : 0,
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color');

  // Update project progress
  await updateProjectProgress(project);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(project.toString()).emit('task:created', populatedTask);
  }

  res.status(201).json({ success: true, data: populatedTask });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const { title, description, assignee, priority, deadline, tags, status, order } = req.body;

  task.title = title || task.title;
  task.description = description !== undefined ? description : task.description;
  task.assignee = assignee !== undefined ? assignee : task.assignee;
  task.priority = priority || task.priority;
  task.deadline = deadline !== undefined ? deadline : task.deadline;
  task.tags = tags || task.tags;
  task.status = status || task.status;
  task.order = order !== undefined ? order : task.order;

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color');

  // Update project progress
  await updateProjectProgress(task.project._id || task.project);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(task.project.toString()).emit('task:updated', updatedTask);
  }

  res.json({ success: true, data: updatedTask });
});

// @desc    Update task status (for Kanban drag & drop)
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, order } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.status = status;
  task.order = order !== undefined ? order : task.order;
  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color');

  // Update project progress
  await updateProjectProgress(task.project._id || task.project);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(task.project.toString()).emit('task:statusUpdated', updatedTask);
  }

  res.json({ success: true, data: updatedTask });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const projectId = task.project;
  await Task.findByIdAndDelete(task._id);

  // Update project progress
  await updateProjectProgress(projectId);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(projectId.toString()).emit('task:deleted', req.params.id);
  }

  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.comments.push({
    user: req.user._id,
    text,
  });

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('comments.user', 'name email avatar');

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(task.project.toString()).emit('task:commentAdded', updatedTask);
  }

  res.status(201).json({ success: true, data: updatedTask });
});

// Helper: Update project progress based on task completion
const updateProjectProgress = async (projectId) => {
  const totalTasks = await Task.countDocuments({ project: projectId });
  const doneTasks = await Task.countDocuments({ project: projectId, status: 'done' });

  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  await Project.findByIdAndUpdate(projectId, { progress });
};

module.exports = {
  getTasksByProject,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
};
