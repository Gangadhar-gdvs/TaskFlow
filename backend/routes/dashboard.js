const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    // Get all projects user belongs to
    const projects = await Project.find({
      $or: [{ admin: req.user._id }, { members: req.user._id }]
    });
    const projectIds = projects.map(p => p._id);

    // All tasks in those projects (admin sees all, member sees assigned)
    const isAdminInAny = projects.some(p => p.admin.toString() === req.user._id.toString());

    let taskQuery;
    if (isAdminInAny) {
      // Show all tasks in projects where user is admin, plus assigned tasks in member projects
      const adminProjectIds = projects
        .filter(p => p.admin.toString() === req.user._id.toString())
        .map(p => p._id);
      const memberProjectIds = projects
        .filter(p => p.admin.toString() !== req.user._id.toString())
        .map(p => p._id);

      taskQuery = {
        $or: [
          { project: { $in: adminProjectIds } },
          { project: { $in: memberProjectIds }, assignedTo: req.user._id }
        ]
      };
    } else {
      taskQuery = { project: { $in: projectIds }, assignedTo: req.user._id };
    }

    const tasks = await Task.find(taskQuery).populate('assignedTo', 'name email');

    const total = tasks.length;
    const byStatus = {
      'To Do': tasks.filter(t => t.status === 'To Do').length,
      'In Progress': tasks.filter(t => t.status === 'In Progress').length,
      'Done': tasks.filter(t => t.status === 'Done').length,
    };

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length;

    // Tasks per user
    const perUser = {};
    tasks.forEach(t => {
      if (t.assignedTo) {
        const key = t.assignedTo._id.toString();
        if (!perUser[key]) perUser[key] = { name: t.assignedTo.name, count: 0 };
        perUser[key].count++;
      }
    });

    res.json({ total, byStatus, overdue, perUser: Object.values(perUser) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
