;(function () {
    const buttonInfoNode = document.querySelector('.js-info-btn');
    const popupInfoNode = document.querySelector('.js-info-popup');
    const overlay = popupInfoNode?.querySelector('.js-overlay');
    const buttonCloseNode = popupInfoNode?.querySelector('.js-btn-close');
    const htmlNode = document.querySelector('html');

    if (!buttonInfoNode) return;
    if (!popupInfoNode) return;

    function closePopup() {
        popupInfoNode.classList.remove('popup__open')
        popupInfoNode.classList.add('popup__hide')
        htmlNode.classList.remove('scroll-lock')
        htmlNode.style.paddingRight = '0';
    }

    function openPopup() {
        popupInfoNode.classList.remove('popup__hide')
        popupInfoNode.classList.add('popup__open')
        htmlNode.classList.add('scroll-lock')
        const breakpoint = window.matchMedia('(min-width:1024px)');
        if (breakpoint.matches) {
            htmlNode.style.paddingRight = '17px';
        }
    }

    const handleInfoPopup = () => {
        (popupInfoNode.classList.contains('popup__hide')) ? openPopup() : closePopup()
    }

    const handleKeyEscape = (event) => {
        if (event.code === 'Escape') closePopup()
    }

    buttonInfoNode?.addEventListener('click', handleInfoPopup)
    overlay?.addEventListener('click', handleInfoPopup)
    buttonCloseNode?.addEventListener('click', handleInfoPopup)
    document?.addEventListener('keydown', handleKeyEscape)

})()
