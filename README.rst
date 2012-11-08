======
wrapas
======

The ``wrapas`` function is a simple helper to use with continuation passing
style libraries. It helps to resolve some common pattern and problems brought
by this convention and helps the developer to have a better vision of the
control flow of his program.

A `lot of alternatives`_ already exist, I did not check them all. There is
probably some solutions much more accurate to your needs, but here is mine.


Features
--------

* provides a simple way to aggregate results, in a predictable order
* handles errors at one unique place
* prevents multiple calls of a callback
* guarantees that the final callback will be asynchronous
* binds the callback to a given context
* ≈576 bytes minified, ≈370 bytes gzipped, nodejs and browser compliant


Examples
--------

Compile a template:

.. code:: javascript

  function compileTemplate(templatePath, dataPath, callback) {
    var as = wrapas(function (error, template, data) {
      if (error) {
        callback(error);
      }
      else {
        template.render(data);
      }
    });

    fs.readFile(templatePath, as(function (content) {
      return new Template(content);
    }));

    fs.readFile(dataPath, as(function (content) {
      return JSON.stringify(content);
    }));
  }

Fetch multiple ressources:

.. code:: javascript

  {

    // getAllIds: function(callback) { .... },
    // getUser: function(id, callback) { .... },

    getUserNames: function (callback) {
      var as = wrapas(function (error) {
        // Transform the arguments to an array
        callback(error, [].splice.call(arguments, 1));
      }, this);

      this.getAllIds(as(function (ids) {
        ids.forEach(function (id) {
            this.getUser(id, as());
        }, this);
      }));
    }
  }


Dependency
----------

In order to work with callbacks that could be synchronous, we have to use a
function that will do an asynchronous call just after all synchronous code is
run. ``setTimeout(..., 0)`` could be used but it is very slow: the minimum
delay is bound to a few milliseconds, depending on the environment.

We use the ``setImmediate(...)`` alternative, which is only on Internet
Explorer 10 but that can be implemented on other environments as well with
``postMessage`` (recent browsers), ``nextTick`` (nodejs) or ``setTimeout`` (as
a fallback).

Include *immediate.js* if you don't have any better polyfill for this function
(and its counterpart, ``clearImmediate``).


API
---

The ``wrapas`` function will create a ‘callback registry’. It will returns a
function that, when called, registers a new callback, and return a wrapper
function to be used as a callback in continuation passing style APIs like the
nodejs standard library.


``wrapas(function(error, args...), ?object)``
`````````````````````````````````````````````

Create a new ‘callback registry’ in order to track callbacks. The first
argument is a function to call when all callbacks are executed, or if a
callback receive an error. The ``error`` argument is the first error to be
passed to any callback, and the other arguments are values returned by the
functions you register.

The second argument is optional and is passed as context for all callbacks.


``‘callback registry’(function(args...))``
``````````````````````````````````````````

Register a new callback. If the resulting function is called with a truthy
value as first argument, this callback will be called with the other arguments.
Else, the final callback will be called with the first argument and all future
call on functions from the registry will be ignored.

When all resulting function are called and there was no error, the final
callback is called with the defined values returned by the registered
callbacks as arguments.


Random thoughts
---------------

Wrap this library yourself! Chose the `best wrapper`_ that covers your needs.




.. _lot of alternatives: https://github.com/joyent/node/wiki/modules#wiki-async-flow
.. _best wrapper: https://github.com/umdjs/umd
