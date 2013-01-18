function Person(first, last, age) {
  this.first = first;
  this.last = last;
  this.age = age;
}
Person.prototype = {
  getFullName: function() {
    alert(this.first + ' ' + this.last);
  },
  greet: function(other) {
    alert("Hi " + other.first + ", I'm " + this.first + ".");
  }
};

var foo = new Person("foo", "bar", 38);
console.log(foo.first);