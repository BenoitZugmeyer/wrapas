(function () {

  function delay(callback, time, value, error) {
    setTimeout(callback.bind(this, error, value), (time || 1) * 10);
  }

  function makeResultAssert(expectedError) {
    var expectedArgs = [].slice.call(arguments, 1);

    timeout(100);

    return function (error) {
      expect(expect() + 2);
      start();
      clearTimeout(timeoutID);
      ok(error == expectedError, 'Provided error should be right');
      deepEqual([].slice.call(arguments, 1), expectedArgs, 'Provided arguments should be right');
    };
  }

  var timeoutID;
  function timeout(time) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(function () {
      start();
      expect(expect() + 1);
      ok(false, 'Timeout');
    }, time);
  }

  var count;
  function assertOrder(o, message) {
    ok(count === o, message || 'This code should be executed on time. (' + count + ' != ' + o + ')');
    count++;
  }

  module('Async', {
    setup: function () {
      count = 0;
    }
  });

  asyncTest('execute one task', 1, function () {
    var a = wrapas(makeResultAssert(null, 42));

    delay(a(function () {
      assertOrder(0);
      return 42;
    }, 1));
  });

  asyncTest('execute some tasks, one result', 2, function () {
    var a = wrapas(makeResultAssert(null, 42));

    delay(a(function () {
      delay(a(function () {
        assertOrder(0);
      }));

      delay(a(function () {
        assertOrder(1);
        return 42;
      }), 2);
    }));
  });

  asyncTest('tasks should be executed asynchronously, results should keep the order', 5, function () {
    var a = wrapas(makeResultAssert());

    delay(a(function () {
      assertOrder(3);

      delay(a(function () {
        assertOrder(4);
      }), 2);
    }), 4);

    delay(a(function () {
      assertOrder(0);

      delay(a(function () {
        assertOrder(2);
      }), 2);

      delay(a(function () {
        assertOrder(1);
      }));
    }));
  });

  asyncTest('results should keep the order', 0, function () {
    var a = wrapas(makeResultAssert(null, 1, 2, 3, 4, 5));

    delay(a(function () {
      delay(a(function () {
        return 1;
      }), 2);
      return 2;
    }), 4);

    delay(a(function () {
      delay(a(function () {
        return 3;
      }), 2);

      delay(a(function () {
        return 4;
      }));
      return 5;
    }));
  });


  asyncTest('execute some sync task', 3, function () {
    var a = wrapas(makeResultAssert(null, 42));

    a(function () {
      assertOrder(0);
    })();

    delay(a(function () {
      assertOrder(2);
      return 42;
    }));

    a(function () {
      assertOrder(1);
    })();
  });

  asyncTest('fail one simple task', 0, function () {
    var a = wrapas(makeResultAssert(42));

    delay(a(function () {
      assertOrder();
    }), 1, 0, 42);
  });

  asyncTest('fail one task should cancel everything', 1, function () {
    var a = wrapas(makeResultAssert(42));

    delay(a(function () {
      assertOrder(0);
      delay(a(function () {
        assertOrder();
      }), 2);
    }));

    delay(a(function () {
      assertOrder();
    }), 2, 0, 42);
  });

  asyncTest('fail even if it is a sync task followed by other', 0, function () {
    var a = wrapas(makeResultAssert(42));

    a(function () {})(42);

    delay(a(function () {
      assertOrder();
    }));

    a(function () {
      assertOrder();
    })();
  });

  asyncTest('throw error if a callback is used twice', 0, function () {
    var a = wrapas(makeResultAssert(null, 42));
    var callback = a(function () { return 42; });

    delay(function (error, value) {
        callback(error, value);
        try {
          callback(error, value);
          ok(false, 'can’t call a callback twice');
        }
        catch (e) {
        }
    });
  });

  asyncTest('throw error if an wrapas instance is reused after its execution', 1, function () {
    start();
    var a = wrapas(function () {
      try {
        a();
        ok(false, 'can’t reuse an wrapas instance');
      }
      catch (e) {
        ok(true, 'exception thrown');
      }
    });

    a()();
  });

  asyncTest('the callback is called even if the wrapas instance is not used', 1, function () {
    start();
    wrapas(function () {
      ok(true);
    });
  });

}());
