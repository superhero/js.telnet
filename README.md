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
const
Telnet  = require('@superhero/telnet'),
telnet  = new Telnet(),
host    = '127.0.0.1',
port    = 23;

// optional host and port, but you probably like to specify the host at least :)
telnet.connect(host, port)

// all commands are stacked and performed in a series after each other.
.exec(/login: $/i, 'superhero')
.exec(/password: $/i, 'b-real')

/**
 * Argument specification:
 * 1. regex, when found in returned string, then write the command
 * 2. the telnet command to write
 * 3. [optional] how long to sleep, expressed in milliseconds
 * 4. [optional] callback with the returned data after the command has been performed
 */
.exec(/# $/, '<your command>', 0, (data) => {});
```

## options

All options are optional.

```javascript
{
  // timeout in milliseconds, if 0 then never timeout
  timeout     : 60e3,

  // debug options, see "superhero/js.debug" for options
  debug       : {},

  // control the amount of debugging data logged, the smaller the number the less is logged
  debug_level : 3,

  // array of regex, output will be compared to all the regex, if match, exit -> emit error..
  error       : [],

  // array of regex, when the commands queue stack is depleted use this regex to find the end  
  end         : [/# ?$/],

  // list of callbacks when end is found
  onEnd       : [],

  // list of callbacks when the socket connection has closed
  onClose     : [],

  // list of callbacks when an error took place
  onError     : [],

  // list of callbacks when a timeout occurred
  onTimeout   : [],
}
```
