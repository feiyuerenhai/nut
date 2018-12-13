#!/usr/bin/env node

const main = require('../src');
const path = require('path');
const program = require('commander');

program
  .command('watch <entry>')
  .description('[watch and build from given entry file]')
  .action(function (entry) {
    const _entry = path.resolve(process.cwd(), entry);
    main(_entry);
  });

// program
//   .command('build <entry>')
//   .description('[build with minification]')
//   .action(function (entry) {
//     const _entry = path.resolve(process.cwd(), entry);
//     main(_entry, { minify: true });
//   })

program.parse(process.argv);