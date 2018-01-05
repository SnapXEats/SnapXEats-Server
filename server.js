'use strict';

require('dotenv').load({silent: true});

const req = require;
const express    = require('express');
const swagger    = require('./lib/swagger');
const bodyParser = require('body-parser');
const db         = require('./server/models');
const config     = require('./lib/config')();
const winston = require('winston');
const expressWinston = require('express-winston');
const path = require('path');
const moment = require('moment');
const cors = require('cors');
const cluster = require('cluster');
const http = require('http');
const appRoot = require('app-root-path');

const workers = process.env.WORKERS || req('os').cpus().length;

const fs = require('fs');

require('winston-daily-rotate-file');

const app        = express();

app.set('view engine', 'html');
app.set('views', 'public');
app.set('port', config.api.port);

// Use formatter function for create log message format

const formatter = (args) => {
  const date = moment().format('D/MM/YYYY hh:mm:ss');
  const msg = `${date} - ${args.level}  - ${args.message} -
  ${JSON.stringify(args.meta, null, 2)}`;
  console.log('msg', msg);
  return msg;
};

// Check logs directory is exits or not
const dir = `${appRoot}/logs`;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Check error logs directory is exits or not

const errorLogDir = `${appRoot}/errorlogs`;

if (!fs.existsSync(errorLogDir)) {
  fs.mkdirSync(errorLogDir);
}

// enable CORS
app.use(cors());

// express-winston logger makes sense BEFORE the router.
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.DailyRotateFile({
        filename: `${appRoot}/logs/log`,
        datePattern: 'dd-MM-yyyy.',
        prepend: true,
        colorize: true,
        prettyPrint: true,
        json: false,
        formatter,
        maxsize: 50 * 1024 * 1024,
        maxFiles: 10,
        zippedArchive: true
      }),
      new winston.transports.Console({
        json: true,
        colorize: true,
        prettyPrint: true,
        timestamp() {
          return Date.now();
        },
        formatter(options) {
          // Return string will be passed to logger.
          return options.timestamp() + ' ' + options.level.toUpperCase() + ' '
            + (options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? '\n\t'+
              JSON.stringify(options.meta) : '' );
        }
      })
    ],
    exitOnError: false
  })
);

// init swagger
if (config.environment === 'dev') {
  swagger(app);
}

// Start server
const startServer = () => {
  if (process.env.NODE_ENV !== 'test') {
    if (cluster.isMaster) {
      for (let i = 0; i < workers; ++i) {
        const  worker = cluster.fork().process;
        console.log('worker %s started.', worker.pid);
      }

      cluster.on('exit', (worker) => {
        console.log('worker %s died. restart...', worker.process.pid);
        cluster.fork();
      });
    } else {
      http.createServer(app).listen(config.port, config.ip,  () => {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
      });
    }
  } else {
    http.createServer(app).listen(config.api.port, () => {
      console.log('Express server listening on %d, in %s mode', config.api.port, app.get('env'));
    });
  }
};

// database
db.sequelize.sync({ force : config.db.wipe })
  .then(startServer).then(() => {
    console.log('Database synced' +  // eslint-disable-line no-console
    `${config.db.wipe ? ' - data it\'s wiped & schema recreated' : ''}`);
  }).catch((err) => {
    console.log('Server failed to start due to error: %s', err);
  })
  .catch((err) => {
    console.log('Server failed to start due to error: %s', err);
  });

// body parser
app.use(bodyParser.urlencoded({
  extended : false
}));
app.use(bodyParser.json());
// load API routes
require('./server/routes')(app);

process.on('uncaughtException', (err) => {
  const date = new Date().toUTCString();
  console.error(`${date}  uncaughtException:`, err.message);
  console.error(err.stack);
  process.exit(1);
});
exports.logger = new (winston.Logger)({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '/errorlogs', '/error'),
      datePattern: 'dd-MM-yyyy.',
      prepend: true,
      colorize: true,
      prettyPrint: true,
      json: false,
      formatter,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 10,
      zippedArchive: true
    })
  ]
});
