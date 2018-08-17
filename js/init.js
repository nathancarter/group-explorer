// not sure if adding this method to Array is an altogether good idea, but it's awfully useful
//   Alternatives:  move it?  delete it? turn it into a free-standing function somewhere?

if (Array.prototype.equals === undefined) {
   Array.prototype.equals = function (other) {
      return Array.isArray(other) &&
             (this.length == other.length) &&
             this.every( (el,inx) => el == other[inx] );
   }
}

