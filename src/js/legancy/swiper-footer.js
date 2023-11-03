;(function () {
  const swiperFooterRightNode = document.querySelector('.swiper__inner--right')
  const swiperFooterLeftNode = document.querySelector('.swiper__inner--left')

  if (swiperFooterRightNode) {
    const swiperFooterRight = new Swiper(swiperFooterRightNode, {
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
      speed: 7000,
      slidesPerView: 4,
      spaceBetween: 10,
      loop: true,

      breakpoints: {
        240: {
          slidesPerView: 2,
        },
        500: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4.5,
        },
      },
    })
  }

  if (swiperFooterLeftNode) {
    const swiperFooterLeft = new Swiper(swiperFooterLeftNode, {
      autoplay: {
        delay: 0,
        reverseDirection: true,
        disableOnInteraction: false,
      },
      speed: 7000,
      slidesPerView: 4,
      spaceBetween: 10,
      loop: true,

      breakpoints: {
        240: {
          slidesPerView: 2,
        },
        500: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4.5,
        },
      },
    })
  }
})()


