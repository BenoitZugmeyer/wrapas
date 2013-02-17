/*
   setImmediate polyfill

   setImmediate is a usefull feature to run a callback asynchronously, as
   quickly as possible. It acts in the same way as `setTimeout(callback, 0);`,
   but setTimeout has a lower bound of a few milliseconds depending on the
   environment.

   Its counterpart, clearImmediate, is here to cancel an asynchronous call.

   setImmediate is a feature proposed by Microsoft but sadly not followed by
   other browsers.

   MDN documentiation:
     https://developer.mozilla.org/en-US/docs/DOM/window.setImmediate
   Abandonned draft:
     https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
   More complete polyfill:
     https://github.com/NobleJS/setImmediate

   The MIT License (MIT)
   Copyright (c) 2012 Benoît Zugmeyer

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to
   deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
   sell copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
   FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
   IN THE SOFTWARE.
*/

// Declare exported functions as global variables
var setImmediate, clearImmediate;

(function () {
  'use strict';
  /*jshint evil: true, newcap: false*/

  // Simplest way to get the global object
  var global = Function('return this')();

  // IE10 has his own native implementation
  setImmediate = global.setImmediate || global.msSetImmediate;
  clearImmediate = global.clearImmediate || global.msClearImmediate;

  // Make a polyfill based on a function that will asynchronously process the
  // callbacks
  function wakeupPolyfill(make) {
    var timeouts = Object.create(null);
    var id = 0;
    var wakeup = make(function () {
      for (var id in timeouts) {
        try {
          timeouts[id]();
        }
        finally {
          delete timeouts[id];
        }
      }
    });

    setImmediate = function (fn) {
      timeouts[id] = fn;
      wakeup();
      return id++;
    };

    clearImmediate = function (id) {
      delete timeouts[id];
    };
  }

  if (!setImmediate && !clearImmediate) {

    // Polyfill for recent browsers
    if (global.addEventListener && global.postMessage) {

      wakeupPolyfill(function (process) {
        var messageName = 'set-immediate-message';

        global.addEventListener('message', function (event) {
          if (event.source === global && event.data === messageName) {
            event.stopPropagation();
            process();
          }
        }, true);

        return function () {
          global.postMessage(messageName, '*');
        };
      });

    }

    // Polyfill for nodejs
    else if (global.process && global.process.nextTick) {

      wakeupPolyfill(function (process) {
        return function () {
          global.process.nextTick(process);
        };
      });

    }

    // Polyfill for other environments
    else {

      clearImmediate = global.clearTimeout;
      setImmediate = function (fn) { return global.setTimeout(fn, 0); };

    }
  }
}());
