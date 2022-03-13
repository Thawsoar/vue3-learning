const bucket = new WeakMap()
const data = { text: 'hello effect', bar: true, foo: true } 
let activeEffect = null
// 添加属性deps用于存储副作用函数的依赖集合
// function effect(fn) {
// 	activeEffect = fn
// 	fn()
// }
// effect 栈
const effectStack = []
function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(effectFn)
    fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  effectFn.deps = []
  effectFn()
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
  const effectsToRun = new Set(effects)
  // effects && effects.forEach(fn => fn())
  effectsToRun && effectsToRun.forEach(fn => fn())
}

let temp1, temp2
effect(() => {
	// document.body.innerText = obj.text
	// console.log(obj.text)
  console.log('effectFn1 执行')
  effect(function effectFn2() {
    console.log('effectFn2 执行')
    temp2 = obj.bar
  })
  temp1 = obj.foo
})

setTimeout(() => {
  // obj.text = obj.ok ? obj.text : 'not'
  obj.foo = false
  // obj.bar = false
}, 1000)
