;(function () {
    const detailSwiperNode = document.querySelector('.js-detail-swiper')
    if (!detailSwiperNode) return

    const  swiper = new Swiper(detailSwiperNode, {
        slidesPerView: 'auto',
        spaceBetween: 20,
        autoHeight: true,
        navigation: {
            nextEl: '.detail-swiper__button-next',
            prevEl: '.detail-swiper__button-prev'
        },
        breakpoints: {
            320: {
                spaceBetween: 10,
                pagination: {
                    el: '.detail-swiper__pagination',
                    clickable: true,
                },
                navigation: {
                    enabled: false
                },
            },
            768: {
                spaceBetween: 20,
                pagination: {
                    enabled: true
                },
                navigation: {
                    enabled: true
                },
            }
        }
    });
})()
