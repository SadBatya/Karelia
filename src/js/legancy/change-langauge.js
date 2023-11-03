// ;(function () {
//     const languageNode = document.querySelector('.js-language');
//     if(!languageNode) return;
//     const languageButtonChangeNode = languageNode.querySelector('.language__change-btn');
//     const languageListNode = languageNode.querySelector('.language__list');
//
//     if(!languageButtonChangeNode) return;
//
//
//     const valueButton = languageButtonChangeNode.textContent;
//
//     languageListNode.addEventListener('click', (event) => {
//         languageButtonChangeNode.textContent = event.target.textContent;
//
//         handleChangeLanguage()
//     })
//
//     const openChangeLanguage = () => {
//         languageListNode.classList.remove('language__list--close')
//         languageListNode.classList.add('language__list--open')
//     }
//
//     const closeChangeLanguage = () => {
//         languageListNode.classList.remove('language__list--open')
//         languageListNode.classList.add('language__list--close')
//     }
//
//     const handleChangeLanguage = () => {
//         if(languageListNode.classList.contains('language__list--close')) {
//             openChangeLanguage()
//         } else  {
//             closeChangeLanguage()
//         }
//     }
//
//
//     // const handleKeyEscape = (event) => {
//     //     if (event.code === 'Escape') closeChangeLanguage()
//     // }
//
//     // languageButtonChangeNode.addEventListener('click', handleChangeLanguage)
//     // window.addEventListener('keydown', handleKeyEscape)
// })()
