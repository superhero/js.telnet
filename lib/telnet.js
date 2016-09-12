'use strict';

module.exports = (options) =>
{
  const
  bus     = new class extends require('events') {},
  telnet  = new require('net').Socket(),
  config  =
  {
    host    : options.host    || '127.0.0.1',
    port    : options.port    || 23,
    timeout : options.timeout || 0,
    debug   : options.debug   || false,
    end     : options.end     || /# ?$/,
    onEnd   : options.onEnd   || false,
    onError : options.onError || false,
  },
  // debugger tool, logs to the console if the config.debug is set to true..
  debug = (msg) => config.debug && console.log('debug:', msg),
  // waits for data to match the next jobs regex..
  delegate = () =>
  {
    if(queue.length && dto.match(queue[0].regex))
    {
      bus.emit('return', dto);
      dto = '';
      bus.emit('ready');
    }
    else if(!queue.length && dto.match(config.end))
    {
      telnet.end();
    }
  };

  let
  queue = [],
  dto   = '';

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
    bus.emit('return', dto);
  });

  // routing incoming data
  telnet.on('data', (data) =>
  {
    dto += data.toString();
    delegate();
  });

  telnet.on('end', () =>
  {
    debug(`socket: "ended", buffer:\n${dto}`);
    config.onEnd && config.onEnd(dto);
  });

  // if a shell is prompted, then we are no longer processing a request. look
  // for a job in the queue to execute or open up to allow new commands to be
  // executed if no jobs are queued by deactivating the processing flag..
  bus.on('ready', () =>
  {
    const job = queue.shift();
    debug(`executing: "${job.cmd}"`);
    job.callback && bus.once('return', (data) => job.callback(data));
    telnet.write(job.cmd + '\n', () => debug(`executed: "${job.cmd}"`));
  });

  // adding debug observers for the socket events
  config.debug && ['connect','drain','error','lookup','end'].forEach((event) =>
  {
    telnet.on(event, (...args) =>
    {
      args.length
      ? debug(`socket: "${event}", arguments: "${args}"`)
      : debug(`socket: "${event}"`);
    });
  });

  // adding debug observers for the socket "timeout" event
  config.debug && telnet.on('timeout', () =>
  {
    debug(`socket: "timeout", buffer:\n${dto}`);
  });

  // adding debug observers for the module events
  config.debug && ['ready','error'].forEach((event) =>
  {
    bus.on(event, (...args) =>
    {
      args.length
      ? debug(`module: "${event}", arguments: "${args}"`)
      : debug(`module: "${event}"`);
    });
  });

  // adding debug observers for the module "return" event
  config.debug && bus.on('return', (data) =>
  {
    debug(`module: "return", data:\n${data}`);
  });

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
