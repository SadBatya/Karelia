;(function () {
    const blockNode = document.querySelector('.js-hidden-text');
    if (!blockNode) return;
    const articleList = blockNode?.querySelectorAll('.article-block__title-wrapper');
    const breakpoint = window.matchMedia('(min-width:1024px)');


    const handleFixHeightTextBlock = () => {
        if (breakpoint.matches) {
            articleList?.forEach((item) => {
                const textBlock = item.querySelector('.article-block__text');
                const height = textBlock.offsetHeight;
                item.style.bottom = `${-height}px`
            })
        }
    }

    const handleMouseOver = (event) => {
        const textBlock = event.target?.querySelector('.article-block__text');
        const height = textBlock?.offsetHeight;
        event.target.style.transform  = `translate(0, ${-height}px)`
    }

    const handleMouseLeave = (event) => {
        event.target.style.transform  = 'translate(0, 0)'
    }

    articleList?.forEach((item) => {
        item.addEventListener('mouseover', handleMouseOver)
        item.addEventListener('mouseleave', handleMouseLeave)
    })

    document.addEventListener('DOMContentLoaded', handleFixHeightTextBlock)
    window.addEventListener('resize', handleFixHeightTextBlock)
})()
