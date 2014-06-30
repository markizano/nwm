
var Collection = require('./collection.js');
var Window = require('./window.js');

// Workspace
// ---------
var Workspace = function(parent, id, layout) {
  this.parent = parent;

  //  has an id
  this.id = id;

  // Each workspace has a layout
  this.layout = layout;

  // Each workspace has a main_window
  //   this is just a reference to the last-active-window on this workspace.
  this.main_window = null;

  // The collection of windows this workspace contains.
  this.windows = new Collection(this, 'window', 1);

  // The main window can be scaled (interpretation differs)
  this.main_window_scale = 50;

  this.on('rearrange', function() {
    self.parent.emit('rearrange');
  }).on('window.add', function(window) {
    if (! window instanceof Window) {
      console.log('Not a window', window);
      return false;
    }
    this.windows.add(window);
  })
  .on('window.detach', function(window_id) {
    // Merely detaches the window from referencing this workspace as its parent.
    if ( !this.windows.exists(window_id) ) {
      console.log('Not a window', window_id);
      return false;
    }
    delete this.windows[window_id];
    return true;
  })
  .on('window.remove', function(window_id) {
    if ( !this.windows.exists(window_id) ) {
      console.log('Not a window', window_id);
      return false;
    }
    this.windows[window_id].emit('quit');
    this.emit('window.detach', window_id);
    return true;
  });

};

// @bless events
require('util').inherits(Workspace, require('events').EventEmitter);

// Get the currently visible windows (used in implementing layouts)
Workspace.prototype.visibleWindows = function(callback) {
  var self = this;
  var result = [];
  Object.keys(this.windows).forEach(function(window) {
    if ( window.visible ) {
      result.push(this.windows[window]);
    }
  });

  if (typeof callback == 'function') callback(result);
  return result;
};

Workspace.prototype.addWindow = function(window) {
  this.emit('window.add', window);
};

Workspace.prototype.removeWindow = function(window_id) {
  this.emit('window.remove', window_id);
};

Workspace.prototype.detachWindow = function(window_id) {
  this.emit('window.detach', window_id);
};

Workspace.prototype.moveWindow = function(window_id, x, y) {
  if (this.windows.exists(window_id) ) {
    return this.windows.get(window_id).moveWindow(x, y);
  }
  return false;
}

// Rearrange the windows on the current workspace
Workspace.prototype.rearrange = function() {
  return this.parent.rearrange();
};

// Get the main window scale
Workspace.prototype.getMainWindowScale = function() {
  return this.main_window_scale;
};

// Set the main window scale
Workspace.prototype.setMainWindowScale = function(scale) {
  this.main_window_scale = Math.min(Math.max(scale, 1), 99);
  this.rearrange();
};

module.exports = Workspace;

