class Promiss {
  constructor(callback = () => {}) {


    callback.apply(Promiss.resolve, Promiss.reject)
  }
  status = 'PENDING'

  static resolve () {
    this.status

  }
  static reject () {

  }
}

module.exports = Promiss
