// ;(function () {
//   if (window.innerWidth > 1024) {
//     const icons = document.querySelectorAll('.routes__block')
//     const title = document.querySelectorAll('.routes__info')
//     const img = document.querySelectorAll('.routes__img')
//     const imgBig = document.querySelectorAll('.img__big')
//     const imgSmallLeft = document.querySelectorAll('.img__small_left')
//     const imgSmallRight = document.querySelectorAll('.img__small_right')
//
//     if ((!icons, !title, !img, !imgBig, !imgSmallLeft, !imgSmallRight)) {
//       return
//     }
//
//     window.addEventListener('scroll', function () {
//       let value = window.scrollY - 2000
//       img.forEach((el) => {
//         el.style.top = value * 0.03 + 'px'
//       })
//       imgBig.forEach((el) => {
//         el.style.bottom = value * 0.05 + 'px'
//       })
//       imgSmallLeft.forEach((el) => {
//         el.style.right = value * 0.01 + 'px'
//       })
//       imgSmallRight.forEach((el) => {
//         el.style.left = value * 0.01 + 'px'
//       })
//       title.forEach((el) => {
//         el.style.bottom = value * 0.03 + 'px'
//       })
//       icons.forEach((el) => {
//         el.style.bottom = value * 0.03 + 'px'
//       })
//     })
//
//     //паралакс эффект при движении курсора
//     window.addEventListener('mousemove', function (e) {
//       let x = e.clientX / window.innerWidth
//       let y = e.clientY / window.innerHeight
//       imgSmallLeft.forEach((el) => {
//         el.style.transform = 'translate(-' + x * 50 + 'px, -' + y * 50 + 'px)'
//       })
//       imgSmallRight.forEach((el) => {
//         el.style.transform = 'translate(-' + x * 50 + 'px, -' + y * 50 + 'px)'
//       })
//     })
//   }
// })()
