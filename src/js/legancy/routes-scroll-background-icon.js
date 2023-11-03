// ;(function () {
//     const strokeNode = document.querySelector('#path_routes');
//     const strokeLength = strokeNode?.getTotalLength();
//     const routesNode = document.querySelector('.routes');
//
//     if (!routesNode) return;
//     if (!strokeNode) return;
//     strokeNode.style.strokeDasharray = strokeLength;
//     const animationSpeed = 0.2;
//
//     function handleScroll() {
//         const blockTop = routesNode.offsetTop - 100;
//         const blockHeight = routesNode.offsetHeight;
//         const windowHeight = window.innerHeight;
//         const scrollY = window.scrollY;
//
//         // console.log('blockTop', blockTop)
//         // console.log('blockHeight', blockHeight)
//         // console.log('windowHeight', windowHeight)
//         // console.log('scrollY', scrollY)
//
//         // Рассчитайте, на сколько процентов блок проскролен
//
//         let scrollPercentage = (scrollY - blockTop) / (blockHeight - windowHeight) * 100;
//
//         // Ограничьте значение в диапазоне от 0 до 100
//         scrollPercentage = Math.min(100, Math.max(0, scrollPercentage)) / 100;
//         // console.log('scrollPercentage', scrollPercentage)
//
//         const draw = (strokeLength * scrollPercentage);
//         strokeNode.style.strokeDashoffset = strokeLength - draw;
//
//         // let draw = strokeLength * (1 - scrollPercentage * animationSpeed);
//         // strokeNode.style.strokeDashoffset = draw;
//
//         // console.log('draw', draw)
//     }
//
//     window.addEventListener('DOMContentLoaded', handleScroll);
//     window.addEventListener('resize', handleScroll);
//     window.addEventListener('scroll', handleScroll);
//
// })()