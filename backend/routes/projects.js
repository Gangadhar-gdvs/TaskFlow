const router = require('express').Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ admin: req.user._id }, { members: req.user._id }]
    }).populate('admin', 'name email').populate('members', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name required' });
  try {
    const project = await Project.create({ name, description, admin: req.user._id, members: [] });
    await project.populate('admin', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isAdmin = project.admin._id.toString() === req.user._id.toString();
    if (!isAdmin && !isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only admin can add members' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    await project.populate('admin', 'name email');
    await project.populate('members', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only admin can remove members' });

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only admin can delete project' });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
