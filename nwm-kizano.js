#!/usr/bin/node

// modules
var NWM = require('./nwm.js'),
    XK = require('./lib/keysymdef.js'),
    Xh = require('./lib/x.js'),
    child_process = require('child_process'),
    path = require('path');

// instantiate nwm and configure it
var nwm = new NWM();

// load layouts
var layouts = require('./lib/layouts');
nwm.addLayout('tile', layouts.tile);
nwm.addLayout('monocle', layouts.monocle);
nwm.addLayout('wide', layouts.wide);
nwm.addLayout('grid', layouts.grid);

function execute(command, callback) {
  child_process.exec(command, function(err, stdout, stderr){ callback(stdout, stderr); });
}

// convinience functions for writing the keyboard shortcuts
function currentMonitor() {
  return nwm.monitors.get(nwm.monitors.current);
}

function moveToMonitor(window, currentMonitor, otherMonitorId) {
  if (window) {
    window.monitor = otherMonitorId;
    // set the workspace to the current workspace on that monitor
    var otherMonitor = nwm.monitors.get(otherMonitorId);
    window.workspace = otherMonitor.workspaces.current;
    // rearrange both monitors
    currentMonitor.workspaces.get(currentMonitor.workspaces.current).rearrange();
    otherMonitor.workspaces.get(otherMonitor.workspaces.current).rearrange();
  }
}

function resizeWorkspace(increment) {
  var workspace = currentMonitor().currentWorkspace();
  workspace.setMainWindowScale(workspace.getMainWindowScale() + increment);
  workspace.rearrange();
}

// KEYBOARD SHORTCUTS
// Change the base modifier to your liking e.g. Xh.Mod4Mask if you just want to use the meta key without Ctrl
var baseModifier = Xh.Mod4Mask; // Win key

var keyboard_shortcuts = [
  {
    key: [1, 2, 3, 4, 5, 6, 7, 8, 9], // number keys are used to move between screens
    callback: function(event) {
      currentMonitor().go(String.fromCharCode(event.keysym));
    }
  },
  {
    key: [1, 2, 3, 4, 5, 6, 7, 8, 9], // with shift, move windows between workspaces
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.moveWindowTo(monitor.focused_window, String.fromCharCode(event.keysym));
    }
  },
  {
    key: 'Left', // move left and right between workspaces
    callback: function(event) { return currentMonitor().go('left'); }
  },
  {
    key: 'Left', // move a window left and right between workspaces with [shift]
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.moveWindowTo(monitor.focused_window, 'left');
      monitor.go('left');
    }
  },
  {
    key: 'Right', // move left and right between workspaces
    callback: function(event){ return currentMonitor().go('right'); }
  },
  {
    key: 'Right', // move a window left and right between workspaces with [shift]
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.moveWindowTo(monitor.focused_window, 'right');
      monitor.go('right');
    }
  },

  {
    key: 'Up', // move up and down between workspaces
    callback: function(event){ return currentMonitor().go('up'); }
  },
  {
    key: 'Up', // move a window up and down between workspaces with [shift]
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.moveWindowTo(monitor.focused_window, 'up');
      monitor.go('up');
    }
  },

  {
    key: 'Down', // move up and down between workspaces
    callback: function(event){ return currentMonitor().go('Down'); }
  },
  {
    key: 'Down', // move a window up and down between workspaces with [shift]
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.moveWindowTo(monitor.focused_window, 'down');
      monitor.go('down');
    }
  },

  {
    key: 'BackSpace',
    callback: function(event){ return currentMonitor().go('back'); }
  },
  {
    key: 'Return', // enter key launches xterm
    modifier: [ 'shift' ],
    callback: function(event) {
      child_process.spawn('/usr/bin/python', ['/usr/bin/terminator'], { env: process.env });
    }
  },
  {
    key: 'r',
    callback: function(event) {
      function zenity_return(requested_cmd, err) {
        requested_cmd = requested_cmd.trim();
        console.log('Spawning application', requested_cmd);
        logfile = '/var/log/markizano/' + path.basename(requested_cmd).split(' ').shift() + '.log';
        cmd = '/bin/bash -c "{cmd} >{log} 2>&1"'.replace('{cmd}', requested_cmd).replace('{log}', logfile)
        console.log('Running command', cmd)
        child_process.spawn(cmd, [], { env: process.env } );
      }
      execute('zenity --entry --text "What would you like to do?"', zenity_return);
    }
  },
  {
    key: 'c',
    callback: function(event) {
      child_process.spawn('/usr/bin/google-chrome', [], {env: process.env});
    }
  },
  {
    key: 'c', // c key closes the current window
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.focused_window && nwm.wm.killWindow(monitor.focused_window);
    }
  },
  {
    key: 'space', // space switches between layout modes
    callback: function(event) {
      var monitor = currentMonitor();
      var workspace = monitor.currentWorkspace();
      workspace.layout = nwm.nextLayout(workspace.layout);
      // monocle hides windows in the current workspace, so unhide them
      monitor.go(monitor.workspaces.current);
      workspace.rearrange();
    }
  },
  {
    key: ['h', 'F10'], // shrink master area
    callback: function(event) {
      resizeWorkspace(-5);
    }
  },
  {
    key: ['l', 'F11'], // grow master area
    callback: function(event) {
      resizeWorkspace(+5);
    }
  },
  {
    key: 'Tab', // tab makes the current window the main window
    callback: function(event) {
      var monitor = currentMonitor();
      var workspace = monitor.currentWorkspace();
      workspace.mainWindow = monitor.focused_window;
      workspace.rearrange();
    }
  },
  {
    key: 'q', // quit
    modifier: [ 'shift' ],
    callback: function() {
      nwm.stop();
      //process.exit();
    }
  }
];

// take each of the keyboard shortcuts above and make add a key using nwm.addKey
keyboard_shortcuts.forEach(function(shortcut) {
  var callback = shortcut.callback;
  var modifier = baseModifier;
  // translate the modifier array to a X11 modifier
  if(shortcut.modifier) {
    (shortcut.modifier.indexOf('shift') > -1) && (modifier = modifier|Xh.ShiftMask);
    (shortcut.modifier.indexOf('ctrl') > -1) && (modifier = modifier|Xh.ControlMask);
  }
  // add shortcuts
  if(Array.isArray(shortcut.key)) {
    shortcut.key.forEach(function(key) {
      nwm.addKey({ key: XK[key], modifier: modifier }, callback);
    });
  } else {
    nwm.addKey({ key: XK[shortcut.key], modifier: modifier }, callback);
  }
});

// START
nwm.start(function() { });
