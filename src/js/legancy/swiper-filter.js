;(function () {
    window.addEventListener('DOMContentLoaded', () => {
        const resizableSwiper = (breakpoint, swiperClass, swiperSettings, callback) => {
            let swiper;

            breakpoint = window.matchMedia(breakpoint);

            const enableSwiper = function(className, settings) {
                swiper = new Swiper(className, settings);

                if (callback) {
                    callback(swiper);
                }
            }

            const checker = function() {
                if (breakpoint.matches) {
                    return enableSwiper(swiperClass, swiperSettings);
                } else {
                    if (swiper !== undefined) swiper.destroy(true, true);
                    return;
                }
            };

            breakpoint.addEventListener('change', checker);
            checker();
        }

        resizableSwiper(
            '(max-width: 1279px)',
            '.js-swiper-filter',
            {
                slidesPerView: 1,
                effect: 'coverflow',
                coverflowEffect: {
                    rotate: 50,
                    slideShadows: false,
                },
                spaceBetween: 10,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
            }
        );

    });
})()
