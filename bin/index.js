#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import { startServer } from '../lib/server.js'
import * as fs from "node:fs";

const program = new Command();

program
  .name('serve-lite')
  .description('A lightweight static file server with SPA support, gzip, and caching.')
  .option('-p, --port <number>', 'Port to run on', '3000')
  .option('--spa', 'Enable SPA fallback routing')
  .option('--root <!--suppress XmlDeprecatedElement, HtmlDeprecatedTag --><dir>', 'Root directory to serve', 'public')
  .option('--https', 'Enable HTTPS mode')
  .option('--key <path>', 'Path to SSL key')
  .option('--cert <path>', 'Path to SSL cert')
  .option('--auth <user:pass>', 'Enable basic auth with credentials')
  .parse(process.argv);

const cliOptions = program.opts();

// Merge with optional config file
let config = {
  port: parseInt(cliOptions.port),
  root: path.resolve(cliOptions.root),
  spa: !!cliOptions.spa,
  https: !!cliOptions.https,
  sslKeyPath: cliOptions.key,
  sslCertPath: cliOptions.cert
}

if (cliOptions.auth) {
  const [ username, password ] = cliOptions.auth.split(':');
  config.auth = { username, password };
}

const configPath = path.resolve('./server.config.js');
if (fs.existsSync(configPath)) {
  const fileUrl = new URL(`file://${configPath}`);
  const userConfig = await import(fileUrl);
  config = { ...config, ...userConfig.default };
}

startServer(config);
