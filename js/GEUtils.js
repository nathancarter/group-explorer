// not sure if adding these Array is an altogether good idea, but it's awfully useful
// at least make the new functions noticable by preceding them with an underscore
//   Alternatives:  move it?  delete it? turn it into a free-standing function somewhere?

// shallow comparison of one array to another
if (Array.prototype._equals === undefined) {
   Array.prototype._equals = function (other) {
      return Array.isArray(other) &&
             (this.length == other.length) &&
             this.every( (el,inx) => el == other[inx] );
   }
}

// recursive flatten of arrays-within-arrays structure
if (Array.prototype._flatten === undefined) {
   Array.prototype._flatten = function () {
      return this.reduce( (flattened, el) => {
         Array.isArray(el) ? flattened.push(...el._flatten()) : flattened.push(el);
         return flattened;
      }, [])
   }
}

// get last element of an array
if (Array.prototype._last === undefined) {
   Array.prototype._last = function () {
      return this[this.length - 1];
   }
}

