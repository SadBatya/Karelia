;(function () {
    const addPhotoBlockNode = document.querySelector('.js-add-photo');
    if (!addPhotoBlockNode) return;

    const filesPhotoNode = addPhotoBlockNode.querySelector('.js-photo-file');

    const listPhotoNode = addPhotoBlockNode.querySelector('.js-files-photo-list');
    const ICON_DELETE = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round"/>
    </svg>
    `;

    const selectedFiles = [];

    function addFilesToList(files) {

        for (const file of files) {
            selectedFiles.push(file);

            const itemPhoto = document.createElement('li')

            itemPhoto.classList.add('add-photo__item')

            const itemName = document.createElement('span')
            itemName.classList.add('add-photo__file-name')
            itemName.textContent = file.name

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn');
            deleteButton.classList.add('add-photo__file-delete');
            deleteButton.innerHTML = ICON_DELETE

            const loadingWrapperNode = document.createElement('div');
            loadingWrapperNode.classList.add('add-photo__loading-wrapper')
            const loadingNode = document.createElement('div');
            loadingNode.classList.add('add-photo__loading')

            loadingWrapperNode.appendChild(loadingNode)

            deleteButton.addEventListener('click', () => {
                // Удаление файла из массива
                const index = selectedFiles.indexOf(file);

                if (index !== -1) {
                    selectedFiles.splice(index, 1);
                }

                itemPhoto.remove();
            });

            itemPhoto.appendChild(itemName)
            itemPhoto.appendChild(loadingWrapperNode)
            itemPhoto.appendChild(deleteButton)
            listPhotoNode.appendChild(itemPhoto)

            const reader = new FileReader();

            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentLoaded = (e.loaded / e.total) * 100;
                }
            };

            reader.onload = (e) => {
                setTimeout(() => {
                    loadingWrapperNode.remove()
                }, 1000)
            };

            reader.onerror = (e) => {
                console.error('Произошла ошибка при загрузке файла:', e.target.error);
            };

            reader.readAsDataURL(file);

        }
    }

    filesPhotoNode.addEventListener('change', (event) => {
        const files = event.target.files;
        addFilesToList(files)
    })
})()
