let pages = ["home", "calibration", "settings"];

function loadContent() {
    fragmentId = location.hash.slice(1);
    pages.forEach((page, i) => {
        let page_el = document.getElementById(page);
        let nav_el = document.getElementById("nav-" + page);
        if (page == fragmentId) {
            console.log("load ", page);
            page_el.style.display = 'block';
            nav_el.style.transform = nav_el.style.transform.replace(/scale\([0-9|\.]*\)/, 'scale(' + 1.3 + ')');
        } else {
            page_el.style.display = 'none';
            nav_el.style.transform = nav_el.style.transform.replace(/scale\([0-9|\.]*\)/, 'scale(' + 0 + ')');
        }
    });
}
if (!location.hash) {
    location.hash = "#home";
}
window.addEventListener("hashchange", loadContent);
document.addEventListener('deviceready', loadContent, false);