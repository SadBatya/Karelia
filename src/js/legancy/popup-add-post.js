;(function () {
    const buttonAddPostNode = document.querySelectorAll('.js-add-post-btn');
    const popupAddPostNode = document.querySelector('.js-add-post-popup');
    const overlay = popupAddPostNode?.querySelector('.js-overlay');
    const buttonCloseNode = popupAddPostNode?.querySelector('.js-btn-close');
    const htmlNode = document.querySelector('html');

    if (buttonAddPostNode.length === 0) return;
    if (!popupAddPostNode) return;

    function closePopup() {
        popupAddPostNode.classList.remove('popup__open')
        popupAddPostNode.classList.add('popup__hide')
        htmlNode.classList.remove('scroll-lock')
        htmlNode.style.paddingRight = '0';
    }

    function openPopup() {
        popupAddPostNode.classList.remove('popup__hide')
        popupAddPostNode.classList.add('popup__open')
        htmlNode.classList.add('scroll-lock')
        const breakpoint = window.matchMedia('(min-width:1024px)');
        if (breakpoint.matches) {
            htmlNode.style.paddingRight = '17px';
        }
    }

    const handleAddPostPopup = () => {
        // if (!popupAddPostNode) return;
        (popupAddPostNode.classList.contains('popup__hide')) ? openPopup() : closePopup()
    }

    const handleKeyEscape = (event) => {
        if (event.code === 'Escape') closePopup()
    }


    buttonAddPostNode.forEach((button) => {
        button?.addEventListener('click', handleAddPostPopup)
    })
    overlay?.addEventListener('click', handleAddPostPopup)
    buttonCloseNode?.addEventListener('click', handleAddPostPopup)
    document?.addEventListener('keydown', handleKeyEscape)

})()
