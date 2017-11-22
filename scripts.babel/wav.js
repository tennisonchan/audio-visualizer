function Wav (source) {
  return new Wav.fn.init(source);
}

Wav.fn = Wav.prototype = {
  constructor: Wav,
  length: 0,

  connect: function (node) {
    var lastNode = this.last();
    if (lastNode) {
      lastNode.connect(node);
    }
    this.push(node);

    return this;
  },

  disconnect: function (node) {
    var args = [].slice.call(arguments, 1);
    var index = this.indexOf(node);

    if (index !== -1) {
      node.disconnect.apply(node, args);
      this.splice(index, 1);
    }

    return this;
  },

  output: function () {
    var lastNode = this.last();
    if (lastNode) {
      lastNode.connect(this.context.destination);
    } else {
      console.error('No AudioNode connect to output.');
    }

    return this;
  },

  setParams: function (node, audioParams) {
    for (let param in audioParams) {
      let value = audioParams[param];
      if (node[param] instanceof AudioParam) {
        node[param].value = value;
      } else {
        node[param] = value;
      }
    }
  },

  last: function () {
    return this.get(-1);
  },

  get: function( num ) {
    if (num == null) {
      return slice.call( this );
    }

    return num < 0 ? this[num + this.length] : this[num];
  },

  eq: function (i) {
    var len = this.length,
      j = +i + ( i < 0 ? len : 0 );
    return this.pushStack( j >= 0 && j < len ? [this[j]] : [] );
  },

  pushStack: function (elems) {
    var ret = Wav.merge(this.constructor(), elems);
    ret.prevObject = this;

    return ret;
  },

  each: function (callback) {
    return Wav.each(this, callback);
  },

  map: function (callback) {
    return this.pushStack(Wav.map(this, function(elem, i) {
      return callback.call(elem, i, elem);
    }));
  },

  push: function () {
    [].slice.call(arguments).forEach((arg) => {
      this[this.length] = arg;
      this.length++;
    })

    return this;
  },
  splice: function () {
    return Array.prototype.splice;
  },
  indexOf: function () {
    return Array.prototype.indexOf;
  },
}

Wav.extend = Wav.fn.extend = function () {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[ 0 ] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;

    // Skip the boolean and the target
    target = arguments[ i ] || {};
    i++;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !Wav.isFunction( target ) ) {
    target = {};
  }

  // Extend Wav itself if only one argument is passed
  if ( i === length ) {
    target = this;
    i--;
  }

  for ( ; i < length; i++ ) {

    // Only deal with non-null/undefined values
    if ( ( options = arguments[ i ] ) != null ) {

      // Extend the base object
      for ( name in options ) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( Wav.isPlainObject( copy ) ||
          ( copyIsArray = Array.isArray( copy ) ) ) ) {

          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && Array.isArray( src ) ? src : [];

          } else {
            clone = src && Wav.isPlainObject( src ) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = Wav.extend( deep, clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};

Wav.extend({
  merge: function( first, second ) {
    var len = +second.length,
      j = 0,
      i = first.length;

    for ( ; j < len; j++ ) {
      first[ i++ ] = second[ j ];
    }

    first.length = i;

    return first;
  }
});

var init = Wav.fn.init = function(source) {
  if (!source) { return this; }

  this.context = source.context;
  this.source = source;
  this[0] = source;

  this.length = 1;

  return this;
}

init.prototype = Wav.fn;

window.Wav = Wav;

exports = module.exports = Wav;