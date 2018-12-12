#!/usr/bin/env node

const main = require('../src');
const path = require('path');
const program = require('commander');

program
  .command('watch <entry>')
  .description('build command')
  .action(function (entry) {
    const _entry = path.resolve(process.cwd(), entry);
    main(_entry);
  });

program.parse(process.argv);