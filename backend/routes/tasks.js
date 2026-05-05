const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Helper: check if user is project admin
const isAdmin = (project, userId) => project.admin.toString() === userId.toString();

// Get tasks for a project
router.get('/', auth, async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ message: 'projectId required' });
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    const admin = isAdmin(project, req.user._id);
    if (!admin && !isMember) return res.status(403).json({ message: 'Access denied' });

    let tasks;
    if (admin) {
      tasks = await Task.find({ project: projectId })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
    } else {
      tasks = await Task.find({ project: projectId, assignedTo: req.user._id })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task (admin only)
router.post('/', auth, async (req, res) => {
  const { title, description, dueDate, priority, status, projectId, assignedTo } = req.body;
  if (!title || !projectId) return res.status(400).json({ message: 'title and projectId required' });
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdmin(project, req.user._id))
      return res.status(403).json({ message: 'Only admin can create tasks' });

    const task = await Task.create({
      title, description, dueDate, priority, status,
      project: projectId, assignedTo, createdBy: req.user._id
    });
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = task.project;
    const admin = isAdmin(project, req.user._id);
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!admin && !isAssigned)
      return res.status(403).json({ message: 'Access denied' });

    // Members can only update status
    if (!admin) {
      task.status = req.body.status || task.status;
    } else {
      const { title, description, dueDate, priority, status, assignedTo } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority) task.priority = priority;
      if (status) task.status = status;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete task (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!isAdmin(task.project, req.user._id))
      return res.status(403).json({ message: 'Only admin can delete tasks' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
