const express = require('express');
const { updateTask, deleteTask, predictTaskStuck } = require('../controllers/taskController');

const router = express.Router();

router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/predict-stuck', predictTaskStuck);

module.exports = router;
