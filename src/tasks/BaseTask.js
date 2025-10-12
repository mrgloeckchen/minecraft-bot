import EventEmitter from 'eventemitter3';

export class BaseTask extends EventEmitter {
  constructor(name, context) {
    super();
    this.name = name;
    this.context = context;
    this.active = false;
  }

  start(options) {
    this.active = true;
    this.options = options;
    this.emit('started', options);
  }

  stop(reason = 'stopped') {
    if (!this.active) return;
    this.active = false;
    this.emit('stopped', reason);
  }

  tick() {
    if (!this.active) return;
    this.execute();
  }

  execute() {
    throw new Error('execute() not implemented');
  }
}
