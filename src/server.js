require('dotenv').config();
const app    = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logger.info(`Nitara app started on port ${PORT} [env: ${process.env.APP_ENV || 'local'}]`);
});
