const
Debug  = require('@superhero/debug'),
Events = require('events'),
Socket = require('net').Socket;

module.exports = class
{
  constructor(options)
  {
    this.config = Object.assign(
    {
      timeout     : 60e3,
      debug       : {},
      debug_level : 3,
      error       : [],
      end         : [/# ?$/],
      onEnd       : [],
      onError     : [],
      onTimeout   : []
    }, options);

    this.ended      = false;
    this.queue      = [];
    this.buffer     = Buffer.from('');
    this.debug      = new Debug(this.config.debug);
    this.events     = new Events();
    this.socket     = new Socket();
    this.observers  =
    {
      onEnd     : this.config.onEnd,
      onError   : this.config.onError,
      onTimeout : this.config.onTimeout
    };

    // forwarding error message
    this.socket.on('error', (error) =>
    {
      this.debug.log(`error: "${error}"`);
      this.observers.onError.forEach((observer) => observer(error));
    });

    // forwarding timeouts
    this.socket.on('timeout', () =>
    {
      this.flush();
      this.observers.onTimeout.forEach((observer) => observer());
    });

    // trigger the "return" event before exiting, resetting the queue
    this.socket.on('close', (...args) =>
    {
      this.config.debug_level > 1
      && this.debug.log(`socket: "close", arguments: "${args}"`);

      this.queue.length = 0;
      this.flush();
    });

    // routing incoming data
    this.socket.on('data', (data) =>
    {
      this.buffer = Buffer.concat([this.buffer, data]);
      this.delegate();
    });

    // adding debug observers for the module "return" event
    this.events.on('return', (data) => this.debug.log(`return:`, data));

    // when ready for new jobs to be executed
    this.events.on('ready', () =>
    {
      // retrieve the current job
      const job = this.queue.shift();

      // debug
      this.config.debug_level > 1
      && this.debug.log(`executing: "${job.cmd}"`);

      // if a callaback for the command is specified to be called after the
      // command is completed
      job.callback && this.events.once('return', job.callback);

      // executing the queued command with or without a delay depending on
      // specification
      setTimeout(() => this.socket.write(job.cmd + '\n'), job.timeout || 0);
    });

    // debug the socket events
    this.config.debug_level > 2
    && ['connect','drain','error','lookup','end','timeout'].forEach((event) =>
      this.socket.on(event, (...args) =>
        args.length
        ? this.debug.log(`socket: "${event}", arguments:`, args)
        : this.debug.log(`socket: "${event}"`)));

    // debug the module events
    this.config.debug_level > 2
    && ['ready','error'].forEach((event) =>
      this.events.on(event, (...args) =>
        args.length
        ? this.debug.log(`module: "${event}", arguments:`, args)
        : this.debug.log(`module: "${event}"`)));
  }

  flush()
  {
    this.events.emit('return', this.buffer.toString());
    this.buffer = Buffer.from('');

    return this;
  }

  isError(buffer)
  {
    const s = buffer.toString();
    return this.config.error.some((regex) => s.match(regex));
  }

  isEnd(buffer)
  {
    const s = buffer.toString();
    return this.config.end.some((regex) => s.match(regex));
  }

  delegate()
  {
    if(this.queue.length && this.isError(this.buffer))
    {
      this.socket.emit('error', this.buffer.toString());
      this.buffer = Buffer.from('');
    }
    else if(this.queue.length
         && this.buffer.toString().match(this.queue[0].regex))
    {
      this.flush();
      this.events.emit('ready');
    }
    else if(!this.queue.length && this.isEnd(this.buffer))
    {
      this.ended = true;
      this.flush();
      this.observers.onEnd.forEach((observer) => observer());
    }
    else
    {
      this.config.debug_level > 2
      && this.events.emit('return', this.buffer.toString());
    }
    return this;
  }

  connect(host='127.0.0.1', port=23)
  {
    this.socket.connect(port, host, () =>
    {
      this.debug.log(`connected to "${host}:${port}"`);
      this.debug.log(`set timeout to "${this.config.timeout}"`);
      this.socket.setTimeout(this.config.timeout);
    });
    return this;
  }

  disconnect()
  {
    this.socket.end();
    return this;
  }

  onEnd(observer)
  {
    this.ended
    ? observer()
    : this.observers.onEnd.push(observer);
    return this;
  }

  exec(regex, cmd, timeout, callback)
  {
    this.queue.push({regex, cmd, timeout, callback});
    return this;
  }
};
