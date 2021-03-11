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

const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  Object.defineProperty(arrayMethods, method, {
    value: function mutator (...args) {
      const result = original.apply(this, args)
      const ob = this.__ob__
      let inserted
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args
          break
        case 'splice':
          inserted = args.slice(2)
          break
      }
      if (inserted) ob.observeArray(inserted)
      // notify change
      ob.dep.notify()
      return result
    },
    enumerable: false,
    writable: true,
    configurable: true
  })
})


// 内存闭包
let uid = 1

// 每个响应式值对应一个Dep实例
class Dep {
  constructor () {
    // 唯一的实例ID
    this.id = uid++
    // 存储响应式值对应的Watcher
    this.subs = []
  }

  /**
   * 添加一个订阅者
   * @param sub {Watcher}
   */
  addSub (sub) {
    this.subs.push(sub)
  }

  // 执行所有订阅者中的回调函数
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }

  // 在值的get方法执行时，将dep与watcher进行关联
  depend () {
    Dep.target.addDep(this)
  }
}

// 临时存储Watcher
Dep.target = null

// 订阅者
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
  // 触发响应值的get方法
  get () {
    Dep.target = this
    // 此操作会触发响应值的get方法
    let value = this.getter.call(null, this.context)
    // 触发完置空，等待下一个值
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

  /**
   * 添加Watcher到Dep的subs
   * @param dep {Dep}
   */
  addDep (dep) {
    const id = dep.id
    // 判断Watcher是否与传入的Dep建立过联系
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
      // get被触发时，如果Dep.target（Watcher）存在
      if (Dep.target) {
        // 将Watcher推入到Dep的subs数组
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

class Observer {
  constructor(props) {

  }

}

function miniWatch (obj, key, cb) {
  new Watcher(obj, key, cb)
}

