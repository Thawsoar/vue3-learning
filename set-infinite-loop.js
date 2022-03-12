// const set = new Set([1])
// // infinite loop
// set.forEach(item => {
//   set.delete(1)
//   set.add(1)
//   console.log('遍历中')
// })

// 在调用forEach遍历Set集合时，
// 如果一个值已经被访问过了，
// 但该值被删除并重新添加到集合，
// 如果此时forEach遍历没有结束，那么该值会重新被访问

// 解决办法 构造另一个Set集合并遍历他

const set = new Set([1])
const newSet = new Set(set)
newSet.forEach(item => {
  set.delete(1)
  set.add(1)
  console.log('遍历中') 
})
