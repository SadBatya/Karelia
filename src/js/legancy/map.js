;(function () {
    const mapNode = document.querySelector('#map')
    const mapPopup = document.querySelector('#map-popup')

    const mapLat = mapNode?.getAttribute('data-lat')
    const mapLon = mapNode?.getAttribute('data-lon')
    const mapImg = mapNode?.getAttribute('data-img')

    const mapPopupLat = mapPopup?.getAttribute('data-lat')
    const mapPopupLon = mapPopup?.getAttribute('data-lon')
    const mapPopupImg = mapPopup?.getAttribute('data-img')

    const zoom = 12;

    if (!mapNode) return;
    ymaps.ready(init);
    function init() {
        const myMap = new ymaps.Map(mapNode, {
            center: [mapLat, mapLon],
            zoom: zoom
        });

        const placemark = new ymaps.Placemark(myMap.getCenter(), {
            // Зададим содержимое основной части балуна.
            balloonContentBody: `<img src=${mapImg} height="100" width="100">`,
        });
        // Добавим метку на карту.
        myMap.geoObjects.add(placemark);
        // Откроем балун на метке.
        placemark.balloon.open();


        if (mapPopup)  {
            const myMapPopup = new ymaps.Map(mapPopup, {
                center: [mapPopupLat, mapPopupLon],
                zoom: zoom
            });

            const placemark = new ymaps.Placemark(myMapPopup.getCenter(), {
                // Зададим содержимое основной части балуна.
                balloonContentBody: `<img src=${mapPopupImg} height="100" width="100">`,
            });

            // Добавим метку на карту.
            myMapPopup.geoObjects.add(placemark);
            // Откроем балун на метке.
            placemark.balloon.open();
        }

    }

})()
