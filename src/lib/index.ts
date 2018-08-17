import util from 'util';
import { isPlainObject, isEmpty, omit } from 'lodash';
import moment from 'moment';
import chalk, { Chalk } from 'chalk';

interface LogRecord {
  level: number;
  time: number;
  msg: string;
  tag: string;
  err: Error;
  [key: string]: any;
}

const levels: { [key: number]: string } = {
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE',
};

const colors: { [key: number]: Chalk } = {
  60: chalk.bgRed,
  50: chalk.red,
  40: chalk.yellow,
  30: chalk.green,
  20: chalk.blue,
  10: chalk.grey,
};

const standardFields: string[] = [
  'pid',
  'hostname',
  'name',
  'level',
  'time',
  'msg',
  'v',
  'tag',
  'err',
];

function isRecord(line: object | string): line is LogRecord {
  return isPlainObject(line);
}

function indent(value: string): string {
  return value.split(/\r?\n/).join('\n  ');
}

function formatObject(obj: { [key: string]: any }): string {
  const keys = Object.keys(obj);
  const lines = [];

  for (const key of keys) {
    const value = util.inspect(obj[key], {
      depth: null,
      colors: true,
      breakLength: Infinity,
      compact: false,
    });

    lines.push(`${key}: ${value}`);
  }

  return lines.join('\n');
}

export type PrettyFn = (line: LogRecord | string) => string | undefined;

export default function prettyFactory(): PrettyFn {
  return line => {
    let value: LogRecord;
    if (isRecord(line))
      value = line;
    else { // tslint:disable-line:curly
      try {
        value = JSON.parse(line) as LogRecord;
      } catch (err) {
        return line + '\n';
      }
    }
    
    const timestamp = chalk.grey(moment(value.time).format('YYYY-MM-DD HH:mm:ss.SSS'));
    const levelText = (levels[value.level] || 'TRACE').toUpperCase().padStart(5);
    const colored = colors[value.level] || chalk.grey;
    const level = colored(levelText);
    const tag = value.tag && chalk.grey(value.tag);
    const msg = chalk.cyan(indent(value.msg || ''));
    const rest = omit(value, standardFields) as { [key: string]: any };
    
    let str = `${timestamp} ${level}`;
    if (tag)
      str += ` [${tag}]`;
    str += `: ${msg}`;
    
    if (value.err) {
      str += chalk.red(indent(`\n${value.err.stack}`));
      rest.err = omit(value.err, ['message', 'stack']);
    }
    
    if (!isEmpty(rest))
      str += indent(`\n${formatObject(rest)}`);
    
    return str + '\n';
  };
}
