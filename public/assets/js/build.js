if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  // Yes, there's really no need for `Object.defineProperty` here
  NodeList.prototype.forEach = Array.prototype.forEach
  if (typeof Symbol !== 'undefined' && Symbol.iterator && !NodeList.prototype[Symbol.iterator]) {
    Object.defineProperty(NodeList.prototype, Symbol.iterator, {
      value: Array.prototype[Symbol.itereator],
      writable: true,
      configurable: true
    })
  }
}

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

})));

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
      typeof define === 'function' && define.amd ? define(['exports'], factory) :
          (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
        'FileReader' in self &&
        'Blob' in self &&
        (function() {
          try {
            new Blob();
            return true
          } catch (e) {
            return false
          }
        })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
        ArrayBuffer.isView ||
        function(obj) {
          return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
        };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

// CustomEvent micro-polyfill for Internet Explorer (Required for LazyLoad)
;(function () {
  if (typeof window.CustomEvent === 'function') {
    return false
  }

  function CustomEvent(event, params) {
    params = params || {bubbles: false, cancelable: false, detail: undefined}
    var evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent
})()

"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
;
(function (window) {
  if (!!window.BX) {
    return;
  }
  var BX = {};
  BX.type = {
    isString: function isString(item) {
      return item === '' ? true : item ? typeof item == 'string' || item instanceof String : false;
    },
    isNotEmptyString: function isNotEmptyString(item) {
      return BX.type.isString(item) ? item.length > 0 : false;
    },
    isBoolean: function isBoolean(item) {
      return item === true || item === false;
    },
    isNumber: function isNumber(item) {
      return item === 0 ? true : item ? typeof item == 'number' || item instanceof Number : false;
    },
    isFunction: function isFunction(item) {
      return item === null ? false : typeof item == 'function' || item instanceof Function;
    },
    isElementNode: function isElementNode(item) {
      //document.body.ELEMENT_NODE;
      return item && _typeof(item) == 'object' && 'nodeType' in item && item.nodeType == 1 && item.tagName && item.tagName.toUpperCase() != 'SCRIPT' && item.tagName.toUpperCase() != 'STYLE' && item.tagName.toUpperCase() != 'LINK';
    },
    isDomNode: function isDomNode(item) {
      return item && _typeof(item) == 'object' && 'nodeType' in item;
    },
    isArray: function isArray(item) {
      return item && Object.prototype.toString.call(item) == '[object Array]';
    },
    isDate: function isDate(item) {
      return item && Object.prototype.toString.call(item) == '[object Date]';
    },
    isNotEmptyObject: function isNotEmptyObject(item) {
      for (var i in item) {
        if (item.hasOwnProperty(i)) return true;
      }
      return false;
    }
  };
  BX.ajax = function () {};
  BX.showWait = function () {};
  BX.closeWait = function () {};
  window.BX = BX;
})(window);
"use strict";

var createElementFromHTML = function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild;
};
"use strict";

var getScrollBarWidth = function getScrollBarWidth() {
  var inner = document.createElement('p');
  inner.style.width = '100%';
  inner.style.height = '200px';
  var outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.left = '0px';
  outer.style.visibility = 'hidden';
  outer.style.width = '200px';
  outer.style.height = '150px';
  outer.style.overflow = 'hidden';
  outer.appendChild(inner);
  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 === w2) w2 = outer.clientWidth;
  document.body.removeChild(outer);
  return w1 - w2;
};
"use strict";

var getStyle = function getStyle(el, styleProp) {
  var value,
    defaultView = (el.ownerDocument || document).defaultView;
  // W3C standard way:
  if (defaultView && defaultView.getComputedStyle) {
    // sanitize property name to css notation
    // (hypen separated words eg. font-Size)
    styleProp = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase();
    return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  } else if (el.currentStyle) {
    // IE
    // sanitize property name to camelCase
    styleProp = styleProp.replace(/\-(\w)/g, function (str, letter) {
      return letter.toUpperCase();
    });
    value = el.currentStyle[styleProp];
    // convert other units to pixels on IE
    if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
      return function (value) {
        var oldLeft = el.style.left,
          oldRsLeft = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        el.style.left = value || 0;
        value = el.style.pixelLeft + 'px';
        el.style.left = oldLeft;
        el.runtimeStyle.left = oldRsLeft;
        return value;
      }(value);
    }
    return value;
  }
};
"use strict";

var getWindowWidth = function getWindowWidth() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};
"use strict";

var loadScript = function loadScript(src, callback) {
  var s, r, t;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = src;
  s.onload = s.onreadystatechange = function () {
    //console.log( this.readyState ); //uncomment this line to see which ready states are called.
    if (!r && (!this.readyState || this.readyState === 'complete')) {
      r = true;
      if (BX.type.isFunction(callback)) {
        callback();
      }
    }
  };
  t = document.getElementsByTagName('script')[0];
  t.parentNode.insertBefore(s, t);
};
"use strict";

;
(function () {
  function selectStyle(wrapper) {
    var parent = wrapper ? wrapper : document;
    var selects = parent.querySelectorAll('.js-select');
    if (selects.length) {
      selects.forEach(function (select) {
        var trigger = select.querySelector('.js-select-trigger');
        var dropdown = select.querySelector('.js-select-dropdown');
        var changeOptions = select.querySelectorAll('.js-select-options');
        var selected = select.querySelector('.js-select-option-item');
        if (dropdown.clientHeight > 200) {
          var ps = new PerfectScrollbar(dropdown, {
            wheelPropagation: false
          });
          dropdown.style.height = '200px';
          dropdown.style.overflow = 'hidden';
        }
        trigger.onclick = function () {
          triggerInit();
        };
        function triggerInit() {
          if (select.classList.contains('active')) {
            select.classList.remove('active');
          } else {
            selects.forEach(function (el) {
              el.classList.remove('active');
            });
            select.classList.add('active');
          }
        }
        if (changeOptions.length) {
          changeOptions.forEach(function (changeOption) {
            changeOption.addEventListener('click', function () {
              var html = changeOption.querySelector('span').innerHTML.trim();
              changeOptions.forEach(function (el) {
                el.classList.remove('selected');
              });
              changeOption.classList.add('selected');
              selected.value = html;
              select.classList.remove('active');
            });
          });
        }
        document.addEventListener('click', function (evt) {
          if (evt.target.contains(select)) {
            select.classList.remove('active');
          }
        });
      });
    }
  }
  window.selectStyled = {
    styling: selectStyle
  };
  window.selectStyled.styling();
})();
"use strict";

var legancy = {};
window.legancy = legancy;
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
;
(function () {
  var addPhotoBlockNode = document.querySelector('.js-add-photo');
  if (!addPhotoBlockNode) return;
  var filesPhotoNode = addPhotoBlockNode.querySelector('.js-photo-file');
  var listPhotoNode = addPhotoBlockNode.querySelector('.js-files-photo-list');
  var ICON_DELETE = "\n    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\">\n        <path d=\"M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z\"\n              stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"\n              stroke-linejoin=\"round\"/>\n    </svg>\n    ";
  var selectedFiles = [];
  function addFilesToList(files) {
    var _iterator = _createForOfIteratorHelper(files),
      _step;
    try {
      var _loop = function _loop() {
        var file = _step.value;
        selectedFiles.push(file);
        var itemPhoto = document.createElement('li');
        itemPhoto.classList.add('add-photo__item');
        var itemName = document.createElement('span');
        itemName.classList.add('add-photo__file-name');
        itemName.textContent = file.name;
        var deleteButton = document.createElement('button');
        deleteButton.classList.add('btn');
        deleteButton.classList.add('add-photo__file-delete');
        deleteButton.innerHTML = ICON_DELETE;
        var loadingWrapperNode = document.createElement('div');
        loadingWrapperNode.classList.add('add-photo__loading-wrapper');
        var loadingNode = document.createElement('div');
        loadingNode.classList.add('add-photo__loading');
        loadingWrapperNode.appendChild(loadingNode);
        deleteButton.addEventListener('click', function () {
          // Удаление файла из массива
          var index = selectedFiles.indexOf(file);
          if (index !== -1) {
            selectedFiles.splice(index, 1);
          }
          itemPhoto.remove();
        });
        itemPhoto.appendChild(itemName);
        itemPhoto.appendChild(loadingWrapperNode);
        itemPhoto.appendChild(deleteButton);
        listPhotoNode.appendChild(itemPhoto);
        var reader = new FileReader();
        reader.onprogress = function (e) {
          if (e.lengthComputable) {
            var percentLoaded = e.loaded / e.total * 100;
          }
        };
        reader.onload = function (e) {
          setTimeout(function () {
            loadingWrapperNode.remove();
          }, 1000);
        };
        reader.onerror = function (e) {
          console.error('Произошла ошибка при загрузке файла:', e.target.error);
        };
        reader.readAsDataURL(file);
      };
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  filesPhotoNode.addEventListener('change', function (event) {
    var files = event.target.files;
    addFilesToList(files);
  });
})();
// ;(function () {
//     const languageNode = document.querySelector('.js-language');
//     if(!languageNode) return;
//     const languageButtonChangeNode = languageNode.querySelector('.language__change-btn');
//     const languageListNode = languageNode.querySelector('.language__list');
//
//     if(!languageButtonChangeNode) return;
//
//
//     const valueButton = languageButtonChangeNode.textContent;
//
//     languageListNode.addEventListener('click', (event) => {
//         languageButtonChangeNode.textContent = event.target.textContent;
//
//         handleChangeLanguage()
//     })
//
//     const openChangeLanguage = () => {
//         languageListNode.classList.remove('language__list--close')
//         languageListNode.classList.add('language__list--open')
//     }
//
//     const closeChangeLanguage = () => {
//         languageListNode.classList.remove('language__list--open')
//         languageListNode.classList.add('language__list--close')
//     }
//
//     const handleChangeLanguage = () => {
//         if(languageListNode.classList.contains('language__list--close')) {
//             openChangeLanguage()
//         } else  {
//             closeChangeLanguage()
//         }
//     }
//
//
//     // const handleKeyEscape = (event) => {
//     //     if (event.code === 'Escape') closeChangeLanguage()
//     // }
//
//     // languageButtonChangeNode.addEventListener('click', handleChangeLanguage)
//     // window.addEventListener('keydown', handleKeyEscape)
// })()
"use strict";
// ;(function () {
//     const filterButtonNode = document.querySelector('.js-filter-btn');
//     const filterListNode = document.querySelector('.filter-section')
//     const htmlNode = document.querySelector('html');
//     const buttonIcon = document.querySelector('.sight-inner__btn-icon');
//     if (!filterButtonNode) return;
//     if (!filterListNode) return;
//
//     const handleClickFilterButton = () => {
//         if (filterListNode.classList.contains('filter-section--open')) {
//             filterListNode.classList.remove('filter-section--open')
//             htmlNode.classList.remove('scroll-lock')
//             buttonIcon.style.transform = ''
//
//         } else {
//             filterListNode.classList.add('filter-section--open')
//             htmlNode.classList.add('scroll-lock')
//             buttonIcon.style.transform = 'rotate(180deg)'
//
//             const windowHeight = window.innerHeight;
//             const elementRectBottom = filterListNode.getBoundingClientRect().bottom;
//
//             // Сдвигаем скролл к середине списка
//             const containerHeight = filterListNode.clientHeight;
//             if (elementRectBottom >= windowHeight) {
//                 htmlNode.scrollTop = (containerHeight) / 2;
//             }
//         }
//     }
//
//     filterButtonNode.addEventListener('click', handleClickFilterButton)
//     document.addEventListener('keydown', (event) => {
//         if (event.key === 'Escape') {
//             filterListNode.classList.remove('filter-section--open')
//             htmlNode.classList.remove('scroll-lock')
//         }
//     })
// })()
"use strict";
"use strict";

;
(function () {
  var blockNode = document.querySelector('.js-hidden-text');
  if (!blockNode) return;
  var articleList = blockNode === null || blockNode === void 0 ? void 0 : blockNode.querySelectorAll('.article-block__title-wrapper');
  var breakpoint = window.matchMedia('(min-width:1024px)');
  var handleFixHeightTextBlock = function handleFixHeightTextBlock() {
    if (breakpoint.matches) {
      articleList === null || articleList === void 0 || articleList.forEach(function (item) {
        var textBlock = item.querySelector('.article-block__text');
        var height = textBlock.offsetHeight;
        item.style.bottom = "".concat(-height, "px");
      });
    }
  };
  var handleMouseOver = function handleMouseOver(event) {
    var _event$target;
    var textBlock = (_event$target = event.target) === null || _event$target === void 0 ? void 0 : _event$target.querySelector('.article-block__text');
    var height = textBlock === null || textBlock === void 0 ? void 0 : textBlock.offsetHeight;
    event.target.style.transform = "translate(0, ".concat(-height, "px)");
  };
  var handleMouseLeave = function handleMouseLeave(event) {
    event.target.style.transform = 'translate(0, 0)';
  };
  articleList === null || articleList === void 0 || articleList.forEach(function (item) {
    item.addEventListener('mouseover', handleMouseOver);
    item.addEventListener('mouseleave', handleMouseLeave);
  });
  document.addEventListener('DOMContentLoaded', handleFixHeightTextBlock);
  window.addEventListener('resize', handleFixHeightTextBlock);
})();
"use strict";

;
(function (_document) {
  var buttonInfoNode = document.querySelector('.js-info-btn');
  var popupInfoNode = document.querySelector('.js-info-popup');
  var overlay = popupInfoNode === null || popupInfoNode === void 0 ? void 0 : popupInfoNode.querySelector('.js-overlay');
  var buttonCloseNode = popupInfoNode === null || popupInfoNode === void 0 ? void 0 : popupInfoNode.querySelector('.js-btn-close');
  var htmlNode = document.querySelector('html');
  if (!buttonInfoNode) return;
  if (!popupInfoNode) return;
  function closePopup() {
    popupInfoNode.classList.remove('popup__open');
    popupInfoNode.classList.add('popup__hide');
    htmlNode.classList.remove('scroll-lock');
    htmlNode.style.paddingRight = '0';
  }
  function openPopup() {
    popupInfoNode.classList.remove('popup__hide');
    popupInfoNode.classList.add('popup__open');
    htmlNode.classList.add('scroll-lock');
    var breakpoint = window.matchMedia('(min-width:1024px)');
    if (breakpoint.matches) {
      htmlNode.style.paddingRight = '17px';
    }
  }
  var handleInfoPopup = function handleInfoPopup() {
    popupInfoNode.classList.contains('popup__hide') ? openPopup() : closePopup();
  };
  var handleKeyEscape = function handleKeyEscape(event) {
    if (event.code === 'Escape') closePopup();
  };
  buttonInfoNode === null || buttonInfoNode === void 0 || buttonInfoNode.addEventListener('click', handleInfoPopup);
  overlay === null || overlay === void 0 || overlay.addEventListener('click', handleInfoPopup);
  buttonCloseNode === null || buttonCloseNode === void 0 || buttonCloseNode.addEventListener('click', handleInfoPopup);
  (_document = document) === null || _document === void 0 || _document.addEventListener('keydown', handleKeyEscape);
})();
"use strict";

;
(function () {
  var mapNode = document.querySelector('#map');
  var mapPopup = document.querySelector('#map-popup');
  var mapLat = mapNode === null || mapNode === void 0 ? void 0 : mapNode.getAttribute('data-lat');
  var mapLon = mapNode === null || mapNode === void 0 ? void 0 : mapNode.getAttribute('data-lon');
  var mapImg = mapNode === null || mapNode === void 0 ? void 0 : mapNode.getAttribute('data-img');
  var mapPopupLat = mapPopup === null || mapPopup === void 0 ? void 0 : mapPopup.getAttribute('data-lat');
  var mapPopupLon = mapPopup === null || mapPopup === void 0 ? void 0 : mapPopup.getAttribute('data-lon');
  var mapPopupImg = mapPopup === null || mapPopup === void 0 ? void 0 : mapPopup.getAttribute('data-img');
  var zoom = 12;
  if (!mapNode) return;
  ymaps.ready(init);
  function init() {
    var myMap = new ymaps.Map(mapNode, {
      center: [mapLat, mapLon],
      zoom: zoom
    });
    var placemark = new ymaps.Placemark(myMap.getCenter(), {
      // Зададим содержимое основной части балуна.
      balloonContentBody: "<img src=".concat(mapImg, " height=\"100\" width=\"100\">")
    });
    // Добавим метку на карту.
    myMap.geoObjects.add(placemark);
    // Откроем балун на метке.
    placemark.balloon.open();
    if (mapPopup) {
      var myMapPopup = new ymaps.Map(mapPopup, {
        center: [mapPopupLat, mapPopupLon],
        zoom: zoom
      });
      var _placemark = new ymaps.Placemark(myMapPopup.getCenter(), {
        // Зададим содержимое основной части балуна.
        balloonContentBody: "<img src=".concat(mapPopupImg, " height=\"100\" width=\"100\">")
      });

      // Добавим метку на карту.
      myMapPopup.geoObjects.add(_placemark);
      // Откроем балун на метке.
      _placemark.balloon.open();
    }
  }
})();
"use strict";

;
(function (_document) {
  var header = document.querySelector('.wrapper');
  var burgerButtonNode = document.querySelector('.js-burger-button');
  var burgerNavigationNode = document.querySelector('.js-nav');
  var burgerButtonCloseNode = burgerNavigationNode.querySelector('.header__nav-button-close');
  var menuItemsNode = burgerNavigationNode.querySelectorAll('.nav__item');
  var htmlNode = document.querySelector('html');
  var overlay = document.querySelector('.js-overlay-menu');
  if (!burgerButtonNode) return;
  if (!burgerNavigationNode) return;
  if (!menuItemsNode) return;
  var handleCloseMenu = function handleCloseMenu() {
    burgerNavigationNode.classList.remove('header__nav--open');
    burgerNavigationNode.classList.add('header__nav--close');
    htmlNode.classList.remove('scroll-lock');
    var overlay = document.querySelector('.js-overlay-menu');
    overlay === null || overlay === void 0 || overlay.remove();
  };
  var handleOpenMenu = function handleOpenMenu() {
    burgerNavigationNode.classList.remove('header__nav--close');
    burgerNavigationNode.classList.add('header__nav--open');
    htmlNode.classList.add('scroll-lock');
    var overlay = document.createElement('div');
    overlay.classList.add('popup__overlay');
    overlay.classList.add('js-overlay-menu');
    header.appendChild(overlay);
  };
  var handleClickBurgerMenu = function handleClickBurgerMenu() {
    if (burgerNavigationNode.classList.contains('header__nav--open')) {
      handleCloseMenu();
    } else {
      handleOpenMenu();
    }
  };
  var handleClickMenuItem = function handleClickMenuItem(item) {
    if (item.classList.contains('nav__item--close')) {
      item.classList.remove('nav__item--close');
      item.classList.add('nav__item--open');
    } else {
      item.classList.remove('nav__item--open');
      item.classList.add('nav__item--close');
    }
  };
  var handleKeyEscape = function handleKeyEscape(event) {
    if (event.code === 'Escape') handleCloseMenu();
  };
  menuItemsNode.forEach(function (item) {
    item.addEventListener('click', function () {
      return handleClickMenuItem(item);
    });
  });
  burgerButtonNode.addEventListener('click', handleClickBurgerMenu);
  overlay === null || overlay === void 0 || overlay.addEventListener('click', function () {
    console.log(overlay);
  });
  burgerButtonCloseNode.addEventListener('click', handleClickBurgerMenu);
  (_document = document) === null || _document === void 0 || _document.addEventListener('keydown', handleKeyEscape);
})();
"use strict";

;
(function (_document) {
  var buttonAddPostNode = document.querySelectorAll('.js-add-post-btn');
  var popupAddPostNode = document.querySelector('.js-add-post-popup');
  var overlay = popupAddPostNode === null || popupAddPostNode === void 0 ? void 0 : popupAddPostNode.querySelector('.js-overlay');
  var buttonCloseNode = popupAddPostNode === null || popupAddPostNode === void 0 ? void 0 : popupAddPostNode.querySelector('.js-btn-close');
  var htmlNode = document.querySelector('html');
  if (buttonAddPostNode.length === 0) return;
  if (!popupAddPostNode) return;
  function closePopup() {
    popupAddPostNode.classList.remove('popup__open');
    popupAddPostNode.classList.add('popup__hide');
    htmlNode.classList.remove('scroll-lock');
    htmlNode.style.paddingRight = '0';
  }
  function openPopup() {
    popupAddPostNode.classList.remove('popup__hide');
    popupAddPostNode.classList.add('popup__open');
    htmlNode.classList.add('scroll-lock');
    var breakpoint = window.matchMedia('(min-width:1024px)');
    if (breakpoint.matches) {
      htmlNode.style.paddingRight = '17px';
    }
  }
  var handleAddPostPopup = function handleAddPostPopup() {
    // if (!popupAddPostNode) return;
    popupAddPostNode.classList.contains('popup__hide') ? openPopup() : closePopup();
  };
  var handleKeyEscape = function handleKeyEscape(event) {
    if (event.code === 'Escape') closePopup();
  };
  buttonAddPostNode.forEach(function (button) {
    button === null || button === void 0 || button.addEventListener('click', handleAddPostPopup);
  });
  overlay === null || overlay === void 0 || overlay.addEventListener('click', handleAddPostPopup);
  buttonCloseNode === null || buttonCloseNode === void 0 || buttonCloseNode.addEventListener('click', handleAddPostPopup);
  (_document = document) === null || _document === void 0 || _document.addEventListener('keydown', handleKeyEscape);
})();
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
;
(function (window) {
  var options = {},
    defaultOptions = {
      cache: true,
      // сохранять ли кеш запроса
      display: 'block',
      data: {},
      paddingRightElements: [],
      title: 'Окно',
      onAfterAppend: null,
      onAfterOpen: null,
      onAfterClose: null
    };

  /**
   * Создаёт обёртку попапа
   * @returns {HTMLDivElement}
   */
  var createWrap = function createWrap() {
    var wrap = document.createElement('div');
    wrap.dataset.close = 'true';
    wrap.classList.add('popup');
    wrap.innerHTML = "\n    <div class=\"popup__wrap\">\n    <svg class=\"popup__logo-fixed\" width=\"64\" height=\"16\" viewBox=\"0 0 128 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"#FF005C\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M119 18h-13v10h13a5 5 0 000-10zm-17-4v18h17a9 9 0 009-9 9 9 0 00-9-9h-17z\"/><path d=\"M126 0h-24v32h4V4h20V0z\"/></g><g fill=\"#FF005C\"><path d=\"M94 0v32h-4V18H70v14h-4V0h4v14h20V0h4z\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M44 28c6.627 0 12-5.373 12-12S50.627 4 44 4 32 9.373 32 16s5.373 12 12 12zm0 4c8.837 0 16-7.163 16-16S52.837 0 44 0 28 7.163 28 16s7.163 16 16 16z\"/><path d=\"M22 0L8 14H4V0H0v32h4V18h4l14 14 2.82-2.82L11.64 16 24.82 2.82 22 0z\"/></g></svg>\n    <div class=\"popup__close\" data-close=\"true\"><span class=\"popup__close_1\"></span><span class=\"popup__close_2\"></span></div>\n    <div class=\"popup__content-wrap\"><h3 class=\"popup__title\"></h3></div>\n    </div>";
    return wrap;
  };

  /**
   * Установка паддингов, чтобы элементы не прыгали при скрытии скрола у body
   * @param padding
   */
  var setPadding = function setPadding(padding) {
    window.document.body.style.overflowY = padding ? 'hidden' : 'scroll';
    window.document.body.style.paddingRight = padding;
    if (!BX.type.isArray(options.paddingRightElements)) {
      return;
    }
    for (var i in options.paddingRightElements) {
      var selector = options.paddingRightElements[i],
        nodeList = document.querySelectorAll(selector);
      if (!nodeList.length) {
        continue;
      }
      for (var j in nodeList) {
        var currentElement = nodeList[j];
        if (!BX.type.isElementNode(currentElement)) {
          continue;
        }
        currentElement.style.paddingRight = padding;
      }
    }
  };

  /**
   * Возвращает объект попапа
   *
   * @param params
   * @returns {{close(): void, open(): void}}
   */
  window.legancyPopup = function (params) {
    params = _typeof(params) === 'object' ? params : {};
    options = Object.assign({}, defaultOptions, params);
    var promise,
      content = options.content,
      wrap = createWrap();
    if (typeof content === 'string') {
      if (content.indexOf('/') >= 0 || options.ajax === true) {
        promise = fetch(content).then(function (value) {
          return value.ok ? value.text() : '404 Not found';
        }, function (error) {
          return 'Check your internet connection';
        });
      } else {
        promise = new Promise(function (resolve, reject) {
          var popupElement = document.querySelector(content);
          if (BX.type.isElementNode(popupElement)) {
            resolve(popupElement.innerHTML);
          } else {
            reject('Selector content not found');
          }
        });
      }
    } else if (BX.type.isElementNode(content)) {
      promise = new Promise(function (resolve) {
        resolve(content.innerHTML);
      });
    } else {
      promise = new Promise(function (resolve) {
        resolve('Content Type Not Supported');
      });
    }
    var elem = wrap.querySelector('.popup__content-wrap');
    if (options.title === false || !options.title) {
      elem.removeChild(elem.querySelector('.popup__title'));
    } else {
      elem.querySelector('.popup__title').innerHTML = options.title;
    }
    promise.then(function (result) {
      elem.insertAdjacentHTML('beforeend', result);
      document.body.appendChild(wrap);
      if (typeof params.onAfterAppend === 'function') {
        params.onAfterAppend(wrap);
      }
    }, function (error) {
      elem.insertAdjacentHTML('afterBegin', 'Something went wrong');
      console.log(error);
    });
    var closing = false;
    var ANIMATION_SPEED = 200;
    var escClickHandler = function escClickHandler(evt) {
      if (evt.keyCode === 27) {
        methods.close();
      }
    };

    /**
     * @type {{close(): void, open(): void}}
     */
    var methods = {
      open: function open() {
        !closing && wrap.classList.add('popup_open');
        setPadding(getScrollBarWidth() + 'px');
        document.addEventListener('keydown', escClickHandler);
        if (typeof params.onAfterOpen === 'function') {
          params.onAfterOpen(wrap);
        }
      },
      close: function close() {
        closing = true;
        wrap.classList.remove('popup_open');
        wrap.classList.add('popup_hide');
        setTimeout(function () {
          wrap.classList.remove('popup_hide');
          setPadding(0);
          document.removeEventListener('keydown', escClickHandler);
          closing = false;
        }, ANIMATION_SPEED);
        if (typeof params.onAfterClose === 'function') {
          params.onAfterClose(wrap);
        }
      }
    };
    wrap.addEventListener('click', function (ev) {
      if (ev.target.dataset.close) {
        methods.close();
      }
    });
    return methods;
  };

  /**
   * Чтобы не передавать options при каждом открытии попапа
   * можно заранее назначить некоторые опции
   *
   * @param params
   */
  window.legancyPopupInit = function (params) {
    params = _typeof(params) === 'object' ? params : {};
    defaultOptions = Object.assign({}, defaultOptions, params);
  };
})(window);
// ;(function () {
//   if (window.innerWidth > 1024) {
//     const icons = document.querySelectorAll('.routes__block')
//     const title = document.querySelectorAll('.routes__info')
//     const img = document.querySelectorAll('.routes__img')
//     const imgBig = document.querySelectorAll('.img__big')
//     const imgSmallLeft = document.querySelectorAll('.img__small_left')
//     const imgSmallRight = document.querySelectorAll('.img__small_right')
//
//     if ((!icons, !title, !img, !imgBig, !imgSmallLeft, !imgSmallRight)) {
//       return
//     }
//
//     window.addEventListener('scroll', function () {
//       let value = window.scrollY - 2000
//       img.forEach((el) => {
//         el.style.top = value * 0.03 + 'px'
//       })
//       imgBig.forEach((el) => {
//         el.style.bottom = value * 0.05 + 'px'
//       })
//       imgSmallLeft.forEach((el) => {
//         el.style.right = value * 0.01 + 'px'
//       })
//       imgSmallRight.forEach((el) => {
//         el.style.left = value * 0.01 + 'px'
//       })
//       title.forEach((el) => {
//         el.style.bottom = value * 0.03 + 'px'
//       })
//       icons.forEach((el) => {
//         el.style.bottom = value * 0.03 + 'px'
//       })
//     })
//
//     //паралакс эффект при движении курсора
//     window.addEventListener('mousemove', function (e) {
//       let x = e.clientX / window.innerWidth
//       let y = e.clientY / window.innerHeight
//       imgSmallLeft.forEach((el) => {
//         el.style.transform = 'translate(-' + x * 50 + 'px, -' + y * 50 + 'px)'
//       })
//       imgSmallRight.forEach((el) => {
//         el.style.transform = 'translate(-' + x * 50 + 'px, -' + y * 50 + 'px)'
//       })
//     })
//   }
// })()
"use strict";
// ;(function () {
//     const strokeNode = document.querySelector('#path_routes');
//     const strokeLength = strokeNode?.getTotalLength();
//     const routesNode = document.querySelector('.routes');
//
//     if (!routesNode) return;
//     if (!strokeNode) return;
//     strokeNode.style.strokeDasharray = strokeLength;
//     const animationSpeed = 0.2;
//
//     function handleScroll() {
//         const blockTop = routesNode.offsetTop - 100;
//         const blockHeight = routesNode.offsetHeight;
//         const windowHeight = window.innerHeight;
//         const scrollY = window.scrollY;
//
//         // console.log('blockTop', blockTop)
//         // console.log('blockHeight', blockHeight)
//         // console.log('windowHeight', windowHeight)
//         // console.log('scrollY', scrollY)
//
//         // Рассчитайте, на сколько процентов блок проскролен
//
//         let scrollPercentage = (scrollY - blockTop) / (blockHeight - windowHeight) * 100;
//
//         // Ограничьте значение в диапазоне от 0 до 100
//         scrollPercentage = Math.min(100, Math.max(0, scrollPercentage)) / 100;
//         // console.log('scrollPercentage', scrollPercentage)
//
//         const draw = (strokeLength * scrollPercentage);
//         strokeNode.style.strokeDashoffset = strokeLength - draw;
//
//         // let draw = strokeLength * (1 - scrollPercentage * animationSpeed);
//         // strokeNode.style.strokeDashoffset = draw;
//
//         // console.log('draw', draw)
//     }
//
//     window.addEventListener('DOMContentLoaded', handleScroll);
//     window.addEventListener('resize', handleScroll);
//     window.addEventListener('scroll', handleScroll);
//
// })()
"use strict";
// // Scroll top
// legancy.scrollTop = function (options) {
//   options = typeof options === 'object' ? options : {}

//   let scroll = document.createElement('div')
//   scroll.classList.add('scroll-top')
//   scroll.innerHTML =
//     '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 32h62M50 20l12 12-12 12" stroke="#fff" stroke-width="2"/></svg>'

//   scroll.addEventListener('click', () => {
//     window.scrollTo({
//       top: 0,
//       behavior: 'smooth',
//     })
//   })

//   let showTop = options.showTop || 500

//   let scrollTop = () => {
//     let scrollTop =
//       window.scrollY ||
//       document.body.scrollTop ||
//       document.documentElement.scrollTop
//     if (scrollTop > showTop) {
//       scroll.classList.add('scroll-top_show')
//     } else {
//       scroll.classList.remove('scroll-top_show')
//     }
//   }

//   scrollTop()
//   window.addEventListener('scroll', scrollTop)

//   return {
//     init() {
//       document.body.appendChild(scroll)
//     },
//     destroy() {
//       document.body.removeChild(scroll)
//       window.removeEventListener('scroll', scrollTop)
//     },
//   }
// }
"use strict";
"use strict";

;
(function () {
  var detailSwiperNode = document.querySelector('.js-detail-swiper');
  if (!detailSwiperNode) return;
  var swiper = new Swiper(detailSwiperNode, {
    slidesPerView: 'auto',
    spaceBetween: 20,
    autoHeight: true,
    navigation: {
      nextEl: '.detail-swiper__button-next',
      prevEl: '.detail-swiper__button-prev'
    },
    breakpoints: {
      320: {
        spaceBetween: 10,
        pagination: {
          el: '.detail-swiper__pagination',
          clickable: true
        },
        navigation: {
          enabled: false
        }
      },
      768: {
        spaceBetween: 20,
        pagination: {
          enabled: true
        },
        navigation: {
          enabled: true
        }
      }
    }
  });
})();
"use strict";

;
(function () {
  window.addEventListener('DOMContentLoaded', function () {
    var resizableSwiper = function resizableSwiper(breakpoint, swiperClass, swiperSettings, callback) {
      var swiper;
      breakpoint = window.matchMedia(breakpoint);
      var enableSwiper = function enableSwiper(className, settings) {
        swiper = new Swiper(className, settings);
        if (callback) {
          callback(swiper);
        }
      };
      var checker = function checker() {
        if (breakpoint.matches) {
          return enableSwiper(swiperClass, swiperSettings);
        } else {
          if (swiper !== undefined) swiper.destroy(true, true);
          return;
        }
      };
      breakpoint.addEventListener('change', checker);
      checker();
    };
    resizableSwiper('(max-width: 1279px)', '.js-swiper-filter', {
      slidesPerView: 1,
      effect: 'coverflow',
      coverflowEffect: {
        rotate: 50,
        slideShadows: false
      },
      spaceBetween: 10,
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      }
    });
  });
})();
"use strict";

;
(function () {
  var swiperFooterRightNode = document.querySelector('.swiper__inner--right');
  var swiperFooterLeftNode = document.querySelector('.swiper__inner--left');
  if (swiperFooterRightNode) {
    var swiperFooterRight = new Swiper(swiperFooterRightNode, {
      autoplay: {
        delay: 0,
        disableOnInteraction: false
      },
      speed: 7000,
      slidesPerView: 4,
      spaceBetween: 10,
      loop: true,
      breakpoints: {
        240: {
          slidesPerView: 2
        },
        500: {
          slidesPerView: 3
        },
        1024: {
          slidesPerView: 4.5
        }
      }
    });
  }
  if (swiperFooterLeftNode) {
    var swiperFooterLeft = new Swiper(swiperFooterLeftNode, {
      autoplay: {
        delay: 0,
        reverseDirection: true,
        disableOnInteraction: false
      },
      speed: 7000,
      slidesPerView: 4,
      spaceBetween: 10,
      loop: true,
      breakpoints: {
        240: {
          slidesPerView: 2
        },
        500: {
          slidesPerView: 3
        },
        1024: {
          slidesPerView: 4.5
        }
      }
    });
  }
})();
"use strict";

;
(function () {
  var mainSwiper = document.querySelector('.js-main-swiper');
  if (mainSwiper) {
    var swiper = new Swiper(mainSwiper, {
      direction: 'horizontal',
      loop: true,
      navigation: {
        nextEl: '.js-main-swiper .swiper-button-next',
        prevEl: '.js-main-swiper .swiper-button-prev'
      },
      autoplay: {
        delay: 5000,
        stopOnLastSlide: true,
        disableOnInteraction: false
      },
      speed: 600,
      breakpoints: {
        320: {
          navigation: {
            enable: false
          },
          pagination: {
            el: '.js-main-swiper .swiper-pagination'
          }
        },
        768: {
          navigation: {
            enable: true
          },
          pagination: {
            enable: false
          }
        }
      }
    });
  }
})();
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
;
(function () {
  var formAddPostNode = document.querySelector('.js-add-post-form');
  if (!formAddPostNode) return;
  var inputsTextFormNode = formAddPostNode.querySelectorAll('.js-input-text');
  var inputsEmailFormNode = formAddPostNode.querySelectorAll('.js-input-email');
  var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  function addInvalidStyle(el) {
    el.classList.add('input-invalid');
  }
  function addValidStyle(el) {
    el.classList.remove('input-invalid');
  }
  function checkValidEmail(email) {
    return emailRegex.test(email);
  }
  _toConsumableArray(inputsTextFormNode).forEach(function (input) {
    input.addEventListener('blur', function (e) {
      var inputValue = e.target.value;
      if (inputValue.length <= 0) {
        addInvalidStyle(input);
      } else {
        addValidStyle(input);
      }
    });
    input.addEventListener('input', function (e) {
      var inputValue = e.target.value;
      if (inputValue.length <= 0) {
        addInvalidStyle(input);
      } else {
        addValidStyle(input);
      }
    });
    input.addEventListener('invalid', function (e) {
      var inputValue = e.target.value;
      if (inputValue.length <= 0) {
        addInvalidStyle(input);
      } else {
        addValidStyle(input);
      }
    });
  });
  inputsEmailFormNode.forEach(function (input) {
    input.addEventListener('blur', function (e) {
      var emailValue = e.target.value;
      if (!checkValidEmail(emailValue)) {
        addInvalidStyle(input);
      } else {
        addValidStyle(input);
      }
    });
    input.addEventListener('input', function (e) {
      var emailValue = e.target.value;
      if (!checkValidEmail(emailValue)) {
        addInvalidStyle(input);
      } else {
        addValidStyle(input);
      }
    });
    input.addEventListener('invalid', function (e) {
      var emailValue = e.target.value;
      if (!checkValidEmail(emailValue)) {
        addInvalidStyle(input);
      } else {
        addValidStyle(input);
      }
    });
  });
})();
"use strict";

//if dev
window.isDev = window.location.hostname === 'localhost' || window.location.hostname.startsWith('html.dev')

// LazyLoad
;
(function () {
  // Set the options to make LazyLoad self-initialize
  window.lazyLoadOptions = {
    elements_selector: '.lazy'
    // ... more custom settings?
  };

  // Listen to the initialization event and get the instance of LazyLoad
  window.addEventListener('LazyLoad::Initialized', function (event) {
    window.lazyLoadInstance = event.detail.instance;
    window.lazyLoadInstance.update();
  }, false);
})()

// Scroll top
// ;(function () {
//   let scrollTop = legancy.scrollTop()
//   scrollTop.init()
// })()

// SVG
;
(function () {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/svg4everybody/2.1.9/svg4everybody.min.js', function () {
    svg4everybody();
  });
})();