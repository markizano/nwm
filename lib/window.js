// Windows
// -------
var Window = function(nwm, window) {
  this.nwm = nwm;
  this.id = window.id;
  this.x = window.x;
  this.y = window.y;
  this.width = window.width;
  this.height = window.height;
  this.title = window.title;
  this.instance = window.instance;
  this.class = window.class;
  this.isfloating = window.isfloating;
  this.visible = true;
  this.workspace =  window.workspace;

  this.on('render', function(x, y, width, height) {
    this.x = x, this.y = y;
    this.width = width, this.height = height;

    console.log('window.render', this.id, x, y, width, height);
    this.nwm.wm.moveWindow(this.id, x, y);
    this.nwm.wm.resizeWindow(this.id, width, height);
  })
  .on('hide', function() {
    // @TODO: use opacity to fade windows in and out of focus.
    console.log('window.hide');
    this.emit('render', -this.width -1, -this.height -1, this.width, this.height);
  })
  .on('show', function() {
    // @TODO: use opacity to fade windows in and out of focus.
    console.log('window.show');
    this.emit('render', this.x, this.y, this.width, this.height);
  })
  .on('focus', function() {
    console.log('window.focus');
    this.nwm.wm.focusWindow(this);
  })
  .on('quit', function() {
    console.log('window.quit');
    // Terminate this window process.
  });

};

// @bless events
require('util').inherits(Window, require('events').EventEmitter);

Window.prototype.move = function(x, y) {
  this.emit('render', x, y, this.width, this.height);
};

Window.prototype.resize = function(width, height) {
  this.emit('render', this.x, this.y, width, height);
};

Window.prototype.hide = function() {
  if (this.visible) {
    this.visible = false;
    this.emit('hide');
  }
};

Window.prototype.show = function() {
  if (!this.visible) {
    this.visible = true;
    this.emit('show');
  }
};

Window.prototype.focus = function() {
  if ( this.visible ) {
    this.emit('focus');
  }
}

module.exports = Window;

