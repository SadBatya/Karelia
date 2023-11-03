// ;(function () {
//     const filterButtonNode = document.querySelector('.js-filter-btn');
//     const filterListNode = document.querySelector('.filter-section')
//     const htmlNode = document.querySelector('html');
//     const buttonIcon = document.querySelector('.sight-inner__btn-icon');
//     if (!filterButtonNode) return;
//     if (!filterListNode) return;
//
//     const handleClickFilterButton = () => {
//         if (filterListNode.classList.contains('filter-section--open')) {
//             filterListNode.classList.remove('filter-section--open')
//             htmlNode.classList.remove('scroll-lock')
//             buttonIcon.style.transform = ''
//
//         } else {
//             filterListNode.classList.add('filter-section--open')
//             htmlNode.classList.add('scroll-lock')
//             buttonIcon.style.transform = 'rotate(180deg)'
//
//             const windowHeight = window.innerHeight;
//             const elementRectBottom = filterListNode.getBoundingClientRect().bottom;
//
//             // Сдвигаем скролл к середине списка
//             const containerHeight = filterListNode.clientHeight;
//             if (elementRectBottom >= windowHeight) {
//                 htmlNode.scrollTop = (containerHeight) / 2;
//             }
//         }
//     }
//
//     filterButtonNode.addEventListener('click', handleClickFilterButton)
//     document.addEventListener('keydown', (event) => {
//         if (event.key === 'Escape') {
//             filterListNode.classList.remove('filter-section--open')
//             htmlNode.classList.remove('scroll-lock')
//         }
//     })
// })()
