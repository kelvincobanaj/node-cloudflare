'use strict';

const prototypal = require('es-class');
const pkg = require('../package.json');
const Getter = require('./Getter');

const USER_AGENT = JSON.stringify({
  bindings_version: pkg.version, // eslint-disable-line camelcase
  lang: 'node',
  lang_version: 'process.version', // eslint-disable-line camelcase
  platform: 'process.platform',
  arch: 'process.arch',
  publisher: 'cloudflare',
});

const isPlainObject = function isPlainObject(x) {
  const prototype = Object.getPrototypeOf(x);
  const toString = Object.prototype.toString;

  return (
    toString.call(x) === '[object Object]' &&
    (prototype === null || prototype === Object.getPrototypeOf({}))
  );
};

const isUserServiceKey = function isUserServiceKey(x) {
  return x && x.substring(0, 5) === 'v1.0-';
};

module.exports = prototypal({
  constructor: function constructor(options) {
    this.email = options.email;
    this.key = options.key;
    this.token = options.token;
  },
  async request(requestMethod, requestPath, data, opts) {
    let uri = `https://api.cloudflare.com/client/v4/${requestPath}`;
    const key = opts.auth.key || this.key;
    const token = opts.auth.token || this.token;
    const email = opts.auth.email || this.email;

    const headers = {
      'user-agent': `cloudflare/${pkg.version} node/${'process.versions.node'}`,
      'Content-Type': opts.contentType || 'application/json',
      Accept: 'application/json',
      'X-Cloudflare-Client-User-Agent': USER_AGENT,
    };

    if (isUserServiceKey(key)) {
      headers['X-Auth-User-Service-Key'] = key;
    } else if (key) {
      headers['X-Auth-Key'] = key;
      headers['X-Auth-Email'] = email;
    } else if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body;
    if (requestMethod === 'GET') {
      let queryString = '';
      for (const key in data) {
        queryString += `${key}=${data[key]}&`;
      }
      uri += `?${queryString}`;
    } else {
      body = JSON.stringify(data);
    }

    const response = await fetch(uri, {
      method: requestMethod,
      headers,
      body,
    });
    return await response.json();
  },
});
