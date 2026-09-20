function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erro interno no servidor.";

  const response = {
    message,
    statusCode
  };

  if (err.details) {
    response.details = err.details;
  }

  if (statusCode === 500) {
    console.error("Erro não tratado:", err);
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;