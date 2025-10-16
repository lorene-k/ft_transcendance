export function index_setup() {
    const headers = document.getElementsByTagName('head')
    for (let i = 1; i < headers.length; i++) {
        headers.item(i)?.remove();
    }
}
