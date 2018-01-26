String.prototype.firstWord = function() {
    if (this.indexOf(' ') < 0)
        return this;
    return this.substr(0, this.indexOf(' '));
}

String.prototype.lastWord = function() {
    if (this.lastIndexOf(' ') < 0)
        return this;
    return this.substr(this.lastIndexOf(' '));
}

String.prototype.makeID = function(suffix) {
    if (!suffix) suffix = ""
    return this.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + suffix;
}

String.prototype.toTitleCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

//Manual substring function for when css just wont do
String.prototype.limit = function(length) {
    if (this.length > length)
        return this.substr(0, length) + "..."
    return this
}

isFunction = function(obj) {
    var t = {};
    return obj && t.toString.call(obj) === '[object Function]';
}

//clean objects of their angular object identifiers by stringifying and parseing them.
clean = function(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object


Object.defineProperty(Object.prototype, "cloneFrom", { 
    value: function(source) {
        if(this.cloneNode) return this.cloneNode(true);
        for(var attr in source) {
          if(typeof source[attr] != "object")
            this[attr] = source[attr];
          else if(source[attr]==source) this[attr] = this;
          else this[attr] = source[attr].clone();
        }
    },
    enumerable : false
});

Object.defineProperty(Object.prototype, "clone", { 
    value: function() {
        if(this.cloneNode) return this.cloneNode(true);
        var copy = this instanceof Array ? [] : {};
        for(var attr in this) {
          if(typeof this[attr] != "object")
            copy[attr] = this[attr];
          else if(this[attr]==this) copy[attr] = copy;
          else copy[attr] = this[attr].clone();
        }
        return copy;
    },
    enumerable : false
});

Date.prototype.clone = function() {
  var copy = new Date();
  copy.setTime(this.getTime());
  return copy;
}

Number.prototype.clone = 
Boolean.prototype.clone =
String.prototype.clone = function() {
  return this;
}