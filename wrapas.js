/*
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

var wrapas = (function () {
  var slice = [].slice;

  // Inverse of assert: throw an error if the first value is truthy.
  function throwError(i, message) {
    if (i) {
      throw new Error('Async error: ' + message);
    }
  }

  // Flatten the result tree in a single array.
  function flatten(root, result) {
    // Recurse on all children.
    for (var i = 0, l = root.c.length; i < l; i++) {
      flatten(root.c[i], result);
    }

    // Filter unwanted results.
    if (root.r !== undefined) {
      // Add it to the array.
      result.push(root.r);
    }

    return result;
  }

  /**
    Create a new ‘callbackRegister’ in order to track callbacks.

    @name wrapas
    @function

    @param {function(error, args...)} doneCallback a function to call when all
      callbacks will be executed, or if a callback receive an error. The
      ‘error’ argument is the first error to be passed to any callback, and
      the other arguments are values returned by the function you register.

    @param {object} [context] a context used to call the functions.

    @return {function(callback)} a callbackRegister.
  */
  return function (doneCallback, context) {
    // Count of living callbacks.
    var count = 0;

    // Is the current instance finalized?
    var finalized = false;

    // Error for this instance.
    var error;

    // Root of the result tree. Each sub-node represent a call to a callback
    // instance. Nodes can have two fields:
    // * `c` for children,
    // * `r` for storing the callback result.
    var rootResults = {c: []};

    // Initialize the first parent results to the main root.
    var parentResults = rootResults;

    // Timeout ID for the final callback.
    var doneTimeout;

    /**
      Register a new callback. If the resulting function is called with a falsy
      `error` as first argument, the `callback` function will be called with
      the other arguments. Else, the `doneCallback` will be called with the
      `error`. When all resulting function are called, the `doneCallback` is
      called with the returning defined values of the registered `callback` as
      arguments.

      @name callbackRegister
      @function

      @param {function(args...)} [callback] a function that will be called if no
        `error` is given to the resulting function. If no callback is defined,
        the function will act as if `function (value) { return value; }` is
        passed.

      @return {function(error, args...)} a cpscallback.
    */
    return function (callback) {
      // As we don’t want the `doneCallback` to be executed twice, we throw an
      // error if it has already been called.
      throwError(finalized, 'do not reuse an wrapas instance');

      // If an error occured, ignore all future calls.
      if (error) {
        return function () {};
      }

      // Is `callback` already been called?
      var called;

      // Create and push the local tree node in the parent.
      var localResults = {c: []};
      parentResults.c.push(localResults);

      // Increment the living callback count.
      count++;

      // Cancel any potential final call to `doneCallback`.
      clearImmediate(doneTimeout);

      /**
        A function to use in continuous passing style APIs.

        @name cpscallback
        @function

        @param {any} [localError] if truthy, it indicates that the call has
          failed and indentifies the resulting error.

        @param {any} [other arguments...] the resulting call values.
      */
      return function (localError, firstArgument) {
        // As we don’t want the `callback` to be executed twice, we throw an
        // error if it has already been called.
        throwError(called, 'callback called more than once');
        called = true;

        // Decrement the living callback count.
        count--;

        // If there already is an error, stop here.
        if (error) {
          return;
        }

        // Store the local error (if any).
        error = localError;

        // If there is no error, call the `callback` and and store its result.
        // `parentResults` becomes `localResults`, so if there is new callbacks
        // registered in this callback, their results will be stored in the
        // descending node of the tree.
        if (!error) {
          parentResults = localResults;
          localResults.r = callback ?
            callback.apply(context, slice.call(arguments, 1)) :
            firstArgument;
        }

        // If there is an error or no more leaving callback, finalize the
        // process asynchronously. Set the instance as `finalized`, flatten the
        // result tree and call the `doneCallback` function.
        if (error || count < 1) {
          doneTimeout = setImmediate(function () {
            finalized = true;
            doneCallback.apply(context, flatten(rootResults, [error]));
          }, 0);
        }
      };
    };
  };
}());
