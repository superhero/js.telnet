# Telnet

Licence: [MIT](https://opensource.org/licenses/MIT)

---

[![npm version](https://badge.fury.io/js/%40superhero%2Ftelnet.svg)](https://badge.fury.io/js/%40superhero%2Ftelnet)

A simple telnet client

## Install

`npm install @superhero/telnet`

...or just set the dependency in your `package.json` file:

```json
{
  "dependencies":
  {
    "@superhero/telnet": "*"
  }
}
```

## Example

```javascript
'use strict';

module.exports = (callback) =>
{
  const
  telnet = require('@superhero/telnet')(
  {
    timeout   : 60000,
    onError   : callback,
    onEnd     : callback,
    onTimeout : callback,
    debug     : true
  }).connect();

  // all commands are stacked and performed in a series after each other.
  telnet
  .exec(/login: $/i, 'superhero')
  .exec(/password: $/i, 'b-real')

  /**
   * 1. regex, when found in returned string.. make new command
   * 2. the telnet command to perform
   * 3. callback with the returned data after the command has been performed
   */
  .exec(/# $/, '<your command>', (data) => {});
};
```

## options

All options are optional.

```javascript
{
  // address to connect to
  host      : '127.0.0.1',

  // connection port
  port      : 23,

  // timeout in milliseconds, if 0 then never timeout
  timeout   : 0,

  // debug mode
  debug     : false,

  // when the commands queue stack is depleted use this regex to find the end  
  end       : /# ?$/,

  // callback when end is found
  onEnd     : undefined,

  // callabck when an error took place
  onError   : undefined,

  // callback when a timeout occurred
  onTimeout : undefined,
}
```
