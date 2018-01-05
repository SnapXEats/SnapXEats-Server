'use strict';

const walkSync = require('walk-sync');
const appRoot  = require('app-root-path');

describe('Test Suite', () => {
  const paths = walkSync('./server', { globs : ['**/tests/*.js'] });

  paths.forEach(filename => require(`${appRoot}/server/${filename}`)()); // eslint-disable-line global-require, max-len

  before((done) => {
    done();
  });

  after((done) => {
    done();
  });
});
