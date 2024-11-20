export const sendErrorResponse = (res, err = {}) => {
  if (err.message) res.statusMessage = err.message
  res.statusCode = err.statusCode || 400

  const result = { error: err, message: err.message }
  if (process.env.NODE_ENV !== 'prod') {
    result.stack = err.stack?.split('\n')
  }
  res.send(result)
}
