;(function () {
  const mainSwiper = document.querySelector('.js-main-swiper')

  if (mainSwiper) {
    const swiper = new Swiper(mainSwiper, {
      direction: 'horizontal',
      loop: true,
      navigation: {
        nextEl: '.js-main-swiper .swiper-button-next',
        prevEl: '.js-main-swiper .swiper-button-prev',
      },
      autoplay: {
        delay: 5000,
        stopOnLastSlide: true,
        disableOnInteraction: false,
      },
      speed: 600,
      breakpoints: {
        320: {
          navigation: {
            enable: false,
          },
          pagination: {
            el: '.js-main-swiper .swiper-pagination',
          },
        },
        768: {
          navigation: {
            enable: true,
          },
          pagination: {
            enable: false,
          },
        }
      }
    });
  }
})()

