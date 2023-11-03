;(function () {
    const formAddPostNode = document.querySelector('.js-add-post-form');
    if(!formAddPostNode) return;
    const inputsTextFormNode = formAddPostNode.querySelectorAll('.js-input-text')

    const inputsEmailFormNode = formAddPostNode.querySelectorAll('.js-input-email')

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    function addInvalidStyle(el) {
        el.classList.add('input-invalid')
    }
    function addValidStyle(el) {
        el.classList.remove('input-invalid')
    }

    function checkValidEmail(email) {
        return emailRegex.test(email)
    }

    [...inputsTextFormNode].forEach((input) => {
        input.addEventListener('blur', (e) => {
            const inputValue = e.target.value;
            if (inputValue.length <= 0) {
                addInvalidStyle(input)
            } else  {
                addValidStyle(input)
            }
        })

        input.addEventListener('input', (e) => {
            const inputValue = e.target.value;
            if (inputValue.length <= 0) {
                addInvalidStyle(input)
            } else  {
                addValidStyle(input)
            }
        })

        input.addEventListener('invalid', (e) => {
            const inputValue = e.target.value;
            if (inputValue.length <= 0) {
                addInvalidStyle(input)
            } else  {
                addValidStyle(input)
            }
        })

    })

    inputsEmailFormNode.forEach((input) => {
        input.addEventListener('blur', (e) => {
            const emailValue = e.target.value;
            if (!checkValidEmail(emailValue)) {
                addInvalidStyle(input)
            } else  {
                addValidStyle(input)
            }
        })

        input.addEventListener('input', (e) => {
            const emailValue = e.target.value;
            if (!checkValidEmail(emailValue)) {
                addInvalidStyle(input)
            } else  {
                addValidStyle(input)
            }
        })

        input.addEventListener('invalid', (e) => {
            const emailValue = e.target.value;
            if (!checkValidEmail(emailValue)) {
                addInvalidStyle(input)
            } else  {
                addValidStyle(input)
            }
        })
    })

})()
