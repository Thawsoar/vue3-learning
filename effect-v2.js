const bucket = new WeakMap()
const data = { text: 'hello effect' } 
let activeEffect = null
function effect(fn) {
	activeEffect = fn
	fn()
}

const obj = new Proxy(data, {
  get(target, key) {
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
    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal
    const depsMap = bucket.get(target)
    if (!depsMap) return
    const effects = depsMap.get(key)
    effects && effects.forEach(fn => fn())
  }
})

effect(() => {
	// document.body.innerText = obj.text
	console.log(obj.text)
})

setTimeout(() => {
	obj.notExist = 'hello vue3'
  obj.text = 'update text'
}, 1000)
