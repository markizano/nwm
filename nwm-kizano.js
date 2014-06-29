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

if ( process.env.DISPLAY && process.env.DISPLAY == ':1' ) {
  baseModifier = Xh.Mod4Mask|Xh.ControlMask; // Win + Ctrl
}

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
      monitor.windowTo(monitor.focused_window, String.fromCharCode(event.keysym));
    }
  },
  { // KIZANO
    key: 'Left', // move left and right between workspaces
    callback: function(event) { return currentMonitor().goPrevious(); }
  },
  {
    key: 'Left', // move a window left and right between workspaces with [shift]
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.windowPrev(monitor.focused_window);
      monitor.goPrevious();
    }
  },
  {
    key: 'Right', // move left and right between workspaces
    callback: function(event){ return currentMonitor().goNext(); }
  },
  {
    key: 'Right', // move a window left and right between workspaces with [shift]
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      monitor.windowNext(monitor.focused_window);
      monitor.goNext();
    }
  },
  {
    key: 'BackSpace',
    callback: function(event){ return currentMonitor().goBack(); }
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
    key: 'comma', // moving windows between monitors
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      var window = nwm.windows.get(monitor.focused_window);
      if(window) { // empty if no windows
        moveToMonitor(window, monitor, nwm.monitors.next(window.monitor));
      }
    }
  },
  {
    key: 'period', // moving windows between monitors
    modifier: [ 'shift' ],
    callback: function(event) {
      var monitor = currentMonitor();
      var window = nwm.windows.get(monitor.focused_window);
      if(window) { // empty if no windows
        moveToMonitor(window, monitor, nwm.monitors.prev(window.monitor));
      }
    }
  },
  {
    key: 'j', // moving focus
    callback: function() {
      var monitor = currentMonitor();
      if(monitor.focused_window && nwm.windows.exists(monitor.focused_window)) {
        var window = nwm.windows.get(monitor.focused_window);
        do {
          var previous = nwm.windows.prev(window.id);
          window = nwm.windows.get(previous);
        }
        while(window.workspace != monitor.workspaces.current);
        console.log('Current', monitor.focused_window, 'previous', window.id);
        monitor.focused_window = window.id;
        nwm.wm.focusWindow(window.id);
      }
    }
  },
  {
    key: 'k', // moving focus
    callback: function() {
      var monitor = currentMonitor();
      if(monitor.focused_window && nwm.windows.exists(monitor.focused_window)) {
        var window = nwm.windows.get(monitor.focused_window);
        do {
          var next = nwm.windows.next(window.id);
          window = nwm.windows.get(next);
        }
        while(window.workspace != monitor.workspaces.current);
        console.log('Current', monitor.focused_window, 'next', window.id);
        monitor.focused_window = window.id;
        nwm.wm.focusWindow(monitor.focused_window);
      }
    }
  },
  {
    key: 'q', // quit
    modifier: [ 'shift' ],
    callback: function() {
      nwm.stop();
      //process.exit();
    }
  },
  {
    key: 'BackSpace',
    callback: function() {
      currentMonitor().goBack();
    }
  },
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
