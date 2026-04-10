const errorHandler = (err, req, res, next) => {
  console.error(err);

  // If it's a custom validation error
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      fields: err.fields
    });
  }

  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorHandler;
