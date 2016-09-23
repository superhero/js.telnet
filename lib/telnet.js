'use strict';

module.exports = (options = {}) =>
{
  let
  // job queue
  queue  = [],
  // data buffer
  buffer = '';

  const
  bus     = new class extends require('events') {},
  telnet  = new require('net').Socket(),
  config  =
  {
    host      : options.host      || '127.0.0.1',
    port      : options.port      || 23,
    timeout   : options.timeout   || 0,
    debug     : options.debug     || false,
    end       : options.end       || /# ?$/,
    onEnd     : options.onEnd     || undefined,
    onError   : options.onError   || undefined,
    onTimeout : options.onTimeout || undefined,
  },
  // debugger tool, logs to the console if the config.debug is set to true..
  debug = (msg) => config.debug && console.log('debug:', msg),
  // flush buffer to output
  flush = () =>
  {
    bus.emit('return', buffer);
    buffer = '';
  },
  // waits for data to match the next jobs regex..
  delegate = () =>
  {
    if(queue.length && buffer.match(queue[0].regex))
    {
      flush();
      bus.emit('ready');
    }
    else if(!queue.length && buffer.match(config.end))
    {
      flush();
      config.onEnd && config.onEnd();
    }
  };

  // forwarding error message, if one appear
  telnet.on('error', (error) =>
  {
    debug(`error: "${error}"`);
    config.onError && config.onError(error);
  });

  // trigger the "return" event before exiting, resetting the queue
  telnet.on('close', (...args) =>
  {
    debug(`socket: "close", arguments: "${args}"`);
    queue = [];
    flush();
  });

  // routing incoming data
  telnet.on('data', (data) =>
  {
    buffer += data.toString();
    delegate();
  });

  // if a shell is prompted, then we are no longer processing a request. look
  // for a job in the queue to execute or open up to allow new commands to be
  // executed if no jobs are queued by deactivating the processing flag..
  bus.on('ready', () =>
  {
    const job = queue.shift();
    debug(`executing: "${job.cmd}"`);
    // if a callaback for the command is specified to be called after the
    // command is completed
    job.callback && bus.once('return', (data) => job.callback(data));
    // executing the qued command
    telnet.write(job.cmd + '\n', () => debug(`executed: "${job.cmd}"`));
  });

  // adding debug observers for the socket events
  config.debug && ['connect','drain','error','lookup','end'].forEach((event) =>
    telnet.on(event, (...args) =>
      args.length
      ? debug(`socket: "${event}", arguments: "${args}"`)
      : debug(`socket: "${event}"`)));

  // adding debug observers for the socket "timeout" event
  config.debug && telnet.on('timeout', () =>
    debug(`socket: "timeout", buffer:\n${buffer}`));

  // hook possibility to the timeout event
  telnet.on('timeout', () =>
  {
    flush();
    config.onTimeout && config.onTimeout('timeout');
  });

  // adding debug observers for the module events
  config.debug && ['ready','error'].forEach((event) =>
    bus.on(event, (...args) =>
      args.length
      ? debug(`module: "${event}", arguments: "${args}"`)
      : debug(`module: "${event}"`)));

  // adding debug observers for the module "return" event
  config.debug && bus.on('return', (data) =>
    debug(`module: "return", data:\n${data}`));

  // interface
  return new class
  {
    connect()
    {
      telnet.connect(config.port, config.host, () =>
      {
        debug(`connected to "${config.host}:${config.port}"`);
        debug(`set timeout to "${config.timeout}"`);
        telnet.setTimeout(config.timeout);
      });
      return this;
    }

    exec(regex, cmd, callback)
    {
      queue.push({regex:regex, cmd:cmd, callback:callback});
      return this;
    }
  };
};
