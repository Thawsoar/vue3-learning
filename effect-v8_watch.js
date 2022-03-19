const bucket = new WeakMap()
const data = { text: 'hello effect', bar: true, foo: 1 } 
let activeEffect = null
// 添加属性deps用于存储副作用函数的依赖集合
// effect 栈
const effectStack = []
function effect(fn, options={}) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(effectFn)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.deps = []
  effectFn.options = options
  if(!options.lazy) {
    effectFn()
  }
  return effectFn
}
function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}
const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal
    trigger(target, key)
  }
})

// 用于收集副作用函数的跟踪函数track
function track(target, key) {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

// 触发副作用的函数trigger
function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
  effectsToRun && effectsToRun.forEach(effectFn => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}
// 定义任务队列
const jobQueue = new Set()
const p = new Promise((resolve, reject) => {
  resolve()
})

let isFlushing = false
function flushJob() {
  if(!isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => job())
  }).finally(() => {
    isFlushing = false
  })
}
// const effectFn = effect(() => {
// //  console.log(obj.foo)
//   return obj.foo + obj.bar
// }, {
//    lazy: true
// })
//  将传入的effect的函数当做一个getter
function computed(getter) {
  let value 
  let dirty = true
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      dirty = true
      trigger(obj, 'value')
    }
  })
  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }
  return obj
}

function watch(source, cb, options={}) {
  let getter
  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source)
  }
  let newValue, oldValue
  let cleanup
  function onValidate(fn) {
    clean = fn
  }
  const job = () => {
    newValue = effectFn()
    if (cleanup) {
      cleanup()
    }
    cb(newValue, oldValue, onValidate)
    oldValue = newValue
  }
  const effectFn = effect(
    () => getter(),
    {
      lazy: true,
      scheduler: () => {
        if(options.flush === 'post') {
          const p = Promise.resolve()
          p.then(job)
        } else {
          job()
        }
      }
    }
  )
  if(options.immediate) {
    job()
  } else {
    oldValue = effectFn()
  }
}
function traverse(value, seen= new Set()) {
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  seen.add(value)
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}
const sumRes = computed(() => obj.foo + obj.bar)

watch(
  () => obj.foo,
  (newVal, oldVal, onValidate) => {
    console.log(newVal, oldVal)
    let expired = false
    onValidate(() => {
      expired = true
    })
    if (!expired) {
      console.log('not expired')
    }
  }, {
    immediate: true,
    flush: 'post'
  },
)
obj.foo++
obj.foo++
