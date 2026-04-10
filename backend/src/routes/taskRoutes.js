const express = require('express');
const { updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
