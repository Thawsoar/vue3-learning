// 仅使用set作为“桶”，使得副作用函数与被操作的目标字段之间没有建立明确的联系
// 导致任意修改对象值，都会触发effect
const bucket = new Set()
const data = { text: 'hello effect' }

let activeEffect = null

function effect(fn) {
  activeEffect = fn
  fn()
}

const obj = new Proxy(data, {
  get(target, key) {
    if(activeEffect) {
      bucket.add(activeEffect)
    }
    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal
    bucket.forEach(fn => fn())
    return true
  }
})

effect(() => {
  // document.body.innerText = obj.text
  console.log(obj.text)
})

setTimeout(() => {
  obj.notExist = 'hello vue3'
}, 1000)
