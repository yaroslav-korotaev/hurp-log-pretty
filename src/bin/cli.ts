#!/usr/bin/env node

import fs from 'fs';
import through from 'through2';
import split from 'split2';
import pump from 'pump';
import prettyFactory from '../lib';

const pretty = prettyFactory();

const prettyStream = through.obj((chunk: Buffer, enc: string, callback: () => void): void => {
  const line = pretty(chunk.toString());
  
  if (line === undefined)
    return callback();
  
  process.stdout.write(line);
  callback();
});

if (!process.stdin.isTTY && !fs.fstatSync(0).isFile())
  process.once('SIGINT', () => { /* empty */ });

pump(process.stdin, split(), prettyStream);
