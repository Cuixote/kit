function isObject (obj) {
  return typeof obj === 'object' && obj !== null
}

const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/

let bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));

function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}


let uid = 1

class Dep {
  constructor () {
    this.id = uid++
    this.subs = []
  }
  addSub (sub) {
    this.subs.push(sub)
  }
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
  depend () {
    Dep.target.addDep(this)
  }
}

Dep.target = null

class Watcher {
  constructor (obj, expOrFn, callback) {
    this.context = obj
    this.callback = callback
    this.depIds = new Set()
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
    }
    this.value = this.get()
  }
  get () {
    Dep.target = this
    let value = this.getter.call(null, this.context)
    Dep.target = null
    return value
  }
  run () {
    let newValue = this.get()
    let oldValue = this.value
    this.value = newValue
    this.callback.call(this.context, newValue, oldValue)
  }
  update () {
    this.run()
  }
  addDep (dep) {
    const id = dep.id
    if (!this.depIds.has(id)) {
      this.depIds.add(id)
      dep.addSub(this)
    }

  }
}

function observe (obj) {
  if (isObject(obj)) {
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        observe(item)
      })
    } else {
      Object.keys(obj).forEach(key => {
        defineReactive(obj, key, obj[key])
      })
    }
  }
}

function defineReactive (obj, key, val) {
  const dep = new Dep()
  observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get () {
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set (newVal) {
      if (val !== newVal) {
        val = newVal
        observe(newVal)
        dep.notify()
      }
    }
  })
}

function miniWatch (obj, key, cb) {
  new Watcher(obj, key, cb)
}

