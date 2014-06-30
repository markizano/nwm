
var Window = require('./window.js');
var Workspace = require('./workspace.js');

// Some concepts copied from https://bitbucket.org/mathematicalcoffee/workspace-grid-gnome-shell-extension/src/0739528fb210f05813d2b2e8f19001084c04db23/workspace-grid%40mathematical.coffee.gmail.com/extension.js?at=default

/* These double as keybinding names and ways for moveWorkspace to know which
 * direction I want to switch to
 */
const UP = 'up';
const DOWN = 'down';
const LEFT = 'left';
const RIGHT = 'right';

/**
 * A special collection that wraps the workspaces.
 * Provides events for the collection of workspaces in front of the monitor.
 */
var Workspaces = function(nwm, rows, cols) {
  var i = 0;
  this.super_(nwm, 'workspace', 0);
  this.nwm = nwm;
  this._current_workspace = 0; // Workspace by index
  this.rows = rows;
  this.cols = cols;
  this.count = rows*cols;

  if ( !this.sizeCheck(rows, cols) ) return false;

  while ( i++ <= this.count ) {
    // @TODO: Allow for configuring each of the workspaces.
    this.add(new Workspace(this, i, 'grid') ); // default to the grid layout?
  }
  // Follow-up with any other startup stuff that must happen in a workspace.
  // - Check for user-configs that would tell us programs that should be exec on-startup.

  this.on('rearrange', function() {
    this.nwm.emit('rearrange');
  }).on('window.move', function(cur_workspace_id, window_id, target_workspace_id) {
    var workspace_id      = this.translateWorkspaceId(target_workspace_id),
        cur_workspace     = this.get(cur_workspace_id),
        target_workspace  = this.get(target_workspace_id);

    if ( cur_workspace.windows.exists(window_id) ) {
      var window = cur_workspace.windows.get(window_id);
      cur_workspace.detachWindow(window_id);
      target_workspace.addWindow(window);

      if(target_workspace_id == this.current_workspace) {
        window.show();
      } else {
        window.hide();
      }
      this.nwm.emit('rearrange'); // This may be excessive
    }
  });
};

require('util').inherits(Workspaces, require('./collection.js'));

Workspaces.prototype = {
  get current_workspace() {
    return this._current_workspace;
  },
  set current_workspace(workspace_id) {
    if ( !this.workspaces.exists(workspace_id) ) {
      console.error('Invalid workspace id! ' + workspace_id);
      return false;
    }
    this._current_workspace = workspace_id;
  }
}

// Sanity check to ensure our memory needs are not exceeded our system. This is totally user-configurable, btw
Workspaces.prototype.sizeCheck = function sizeCheck() {
  with ( this.nwm.config ) {
    if ( workspaces.hasOwnProperty('max_workspaces') ) {
      if ( this.count > workspaces.max_workspaces ) {
        console.error('Workspace count greater than max_workspaces: {w}:{m}'.replace('{w}', this.count) ).replace('{m}', workspaces.max_workspaces));
        return false;
      }
    } else {
      console.error('Workspace max_workspaces not set - avoiding a system error.');
      return false;
    }
  }
  return true;
};

// Returns true if any of my workspaces contains a workspace of that ID.
Workspaces.prototype.hasWindow = function hasWindow(window) {
  Object.keys(this.
};

/* Converts an index (from 0 to Monitor.screen.n_workspaces) into [row, column]
 * being the row and column of workspace `index` according to the user's layout.
 *
 * Row and column start from 0.
 */
Workspaces.prototype.indexToRowCol = function indexToRowCol(index) {
  // row-major. 0-based.
  return [Math.floor(index / this.nwm.config.workspaces.cols),
    index % this.nwm.config.workspaces.cols];
}

/* Converts a row and column (0-based) into the index of that workspace.
 *
 * If the resulting index is greater than MAX_WORKSPACES (the maximum number
 * of workspaces allowable by Mutter), it will return -1.
 */
Workspaces.prototype.rowColToIndex = function rowColToIndex(row, col) {
  // row-major. 0-based.
  var idx = row * this.nwm.config.workspaces.cols + col;
  if (idx >= this.nwm.config.max_workspaces) {
    idx = -1;
  }
  return idx;
}

// Takes a few human-readable directions and converts them into something this object can understand.
Workspaces.prototype.translateWorkspaceId = function translateWorkspaceId(workspace_id) {
  switch (workspace_id.toLowerCase()) {
    case 'back':
      workspace_id = this.previous_workspace;
      break;
    case 'next':
      workspace_id = this.items.current +1;
      break;
    case 'prev': case 'previous':
      workspace_id = this.items.current -1;
      break;
    case UP:
      workspace_id = this.getWorkspaceToMy(UP);
      break;
    case DOWN:
      workspace_id = this.getWorkspaceToMy(DOWN);
      break;
    case LEFT:
      workspace_id = this.getWorkspaceToMy(LEFT);
      break;
    case RIGHT:
      workspace_id = this.getWorkspaceToMy(RIGHT);
      break;
  }

  return workspace_id;
}

// Use: next_workspace = this.getWorkspaceToMy('left');
Workspaces.prototype.getWorkspaceToMy = function getWorkspaceToMy(direction) {
  var from, row, col, to, _;
  from = this.items.current;
  _ = this.indexToRowCol(from);
  row = _[0], col = _[1];

  with(this.nwm.config) {
    switch(direction) {
      case LEFT:
        if (col === 0) {
          if (workspaces.hasOwnProperty('wraparound') && workspaces.wraparound) {
            col = cols - 1;
            if (!workspaces.hasOwnProperty('wraparound_same') || !workspaces.wraparound_same) row--;
          }
        } else {
          col--;
        }
        break;
      case RIGHT:
        if (col === cols - 1) {
          workspaces.hasOwnProperty('wraparound') && workspaces.wraparound {
            col = 0;
            if (!workspaces.hasOwnProperty('wraparound_same') || !workspaces.wraparound_same) row++;
          }
        } else {
          col++;
        }
        break;
      case UP:
        if (row === 0) {
          workspaces.hasOwnProperty('wraparound') && workspaces.wraparound {
            row = rows - 1;
            if (!workspaces.hasOwnProperty('wraparound_same') || !workspaces.wraparound_same) col--;
          }
        } else {
          row--;
        }
        break;
      case DOWN:
        if (row === rows - 1) {
          workspaces.hasOwnProperty('wraparound') && workspaces.wraparound {
            row = 0;
            if (!workspaces.hasOwnProperty('wraparound_same') || !workspaces.wraparound_same) col++;
          }
        } else {
          row++;
        }
        break;
    }
    if (col < 0 || row < 0) {
      to = this.rowColToIndex(Math.max(0, row), Math.max(0, col) );
    } else if (
        col > cols - 1 || row > rows - 1
    ) {
      to = 0;
    } else {
      to = this.rowColToIndex(row, col);
    }

    return to;
  }
};

// Move a window to a different workspace. This is irrespective of movement.
// Strictly moves a window. Navigation is a separate function.
Workspaces.prototype.moveWindowTo = function(id, workspace_id) {
  this.emit('window.move', id, workspace_id);
};



