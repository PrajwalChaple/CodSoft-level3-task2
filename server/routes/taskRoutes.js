const express = require('express');
const router = express.Router();
const {
  getTasksByProject,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/my-tasks', getMyTasks);
router.get('/project/:projectId', getTasksByProject);
router.route('/').post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);
router.put('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);

module.exports = router;
