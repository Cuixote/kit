const debounce = require('../lib/debounce')

const d = debounce(function () {
  console.log('im func')
  process.stdin.pause()
  return 'dd'
}, 10000)

d()

process.stdin.on("data", ()=>{})
