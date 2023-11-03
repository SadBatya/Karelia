;(function () {
    const header = document.querySelector('.wrapper');
    const burgerButtonNode = document.querySelector('.js-burger-button');
    const burgerNavigationNode = document.querySelector('.js-nav');
    const burgerButtonCloseNode = burgerNavigationNode.querySelector('.header__nav-button-close');
    const menuItemsNode = burgerNavigationNode.querySelectorAll('.nav__item');
    const htmlNode = document.querySelector('html');
    const overlay = document.querySelector('.js-overlay-menu')

    if (!burgerButtonNode) return;
    if (!burgerNavigationNode) return;
    if (!menuItemsNode) return;

    const handleCloseMenu = () => {
        burgerNavigationNode.classList.remove('header__nav--open')
        burgerNavigationNode.classList.add('header__nav--close')
        htmlNode.classList.remove('scroll-lock')
        const overlay = document.querySelector('.js-overlay-menu')
        overlay?.remove()
    }

    const handleOpenMenu = () => {
        burgerNavigationNode.classList.remove('header__nav--close')
        burgerNavigationNode.classList.add('header__nav--open')
        htmlNode.classList.add('scroll-lock')
        const overlay = document.createElement('div');
        overlay.classList.add('popup__overlay')
        overlay.classList.add('js-overlay-menu')
        header.appendChild(overlay)
    }

    const handleClickBurgerMenu = () => {
       if(burgerNavigationNode.classList.contains('header__nav--open')) {
           handleCloseMenu()
       } else {
           handleOpenMenu()
       }
    }

    const handleClickMenuItem = (item) => {
        if(item.classList.contains('nav__item--close')) {
            item.classList.remove('nav__item--close')
            item.classList.add('nav__item--open')
        } else {
            item.classList.remove('nav__item--open')
            item.classList.add('nav__item--close')
        }
    }

    const handleKeyEscape = (event) => {
        if(event.code === 'Escape') handleCloseMenu()
    }

    menuItemsNode.forEach((item) => {
        item.addEventListener('click', () => handleClickMenuItem(item))
    })

    burgerButtonNode.addEventListener('click', handleClickBurgerMenu)

    overlay?.addEventListener('click', () => {
        console.log(overlay)
    })

    burgerButtonCloseNode.addEventListener('click', handleClickBurgerMenu)
    document?.addEventListener('keydown', handleKeyEscape)

})()
