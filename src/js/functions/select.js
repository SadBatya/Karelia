;(function () {
  function selectStyle(wrapper) {
    const parent = wrapper ? wrapper : document;
    const selects = parent.querySelectorAll('.js-select');
    if (selects.length) {
      selects.forEach(select => {
        const trigger = select.querySelector('.js-select-trigger');
        const dropdown = select.querySelector('.js-select-dropdown');
        const changeOptions =  select.querySelectorAll('.js-select-options');
        const selected = select.querySelector('.js-select-option-item');

        if(dropdown.clientHeight > 200) {
          const ps = new PerfectScrollbar(dropdown, {
            wheelPropagation: false,
          });
          dropdown.style.height = '200px';
          dropdown.style.overflow = 'hidden';
        }

        trigger.onclick = function () {
          triggerInit()
        }

        function triggerInit() {
          if (select.classList.contains('active')) {
            select.classList.remove('active');
          }else {
            selects.forEach(function (el) {el.classList.remove('active')});
            select.classList.add('active');
          }
        }

        if(changeOptions.length) {
          changeOptions.forEach(function (changeOption) {
            changeOption.addEventListener('click', function () {
              const html = changeOption.querySelector('span').innerHTML.trim();
              changeOptions.forEach(function (el) {el.classList.remove('selected')});
              changeOption.classList.add('selected');
              selected.value = html;
              select.classList.remove('active');
            })
          })
        }

        document.addEventListener('click', function (evt) {
          if (evt.target.contains(select)) {
            select.classList.remove('active');
          }
        })
      });
    }
  }

  window.selectStyled = {
    styling: selectStyle,
  };

  window.selectStyled.styling();
})()
