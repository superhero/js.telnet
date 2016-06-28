# Telnet

Licence: [Do What The Fuck You Want To Public License (WTFPL)](http://www.wtfpl.net/about/).

---

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

module.exports = (host, callback) =>
{
  const
  log    = (rsp) => console.log(rsp),
  telnet = require('@superhero/telnet')(
  {
    host    : host,
    port    : 23,
    timeout : 60000,
    error   : callback, // callback(error)
    debug   : true
  }).connect();

  // all commands are stacked and performed in a series after each other.
  telnet
  .exec(/login: $/i, 'superhero')
  .exec(/password: $/i, 'b-real')
  .exec(/# $/, '<your command>', log)
  .exec(/# $/, 'exit', () => callback());
};

```
