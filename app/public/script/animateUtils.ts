export function dropdownTransition(dropdown: HTMLElement, size: string, extraClass?: string) {
	if (extraClass) dropdown.classList.toggle(extraClass);
	const isClosed = dropdown.classList.contains("max-h-0");
	dropdown.classList.toggle("max-h-0", !isClosed);
	dropdown.classList.toggle(size, isClosed);
}

export function toggleCornerDropdown(show: boolean, elem: HTMLElement) {
	elem.classList[show ? "remove" : "add"]("opacity-0", "scale-20", "pointer-events-none");
	elem.classList[show ? "add" : "remove"]("opacity-100", "scale-100", "pointer-events-auto");
}

export function initFadeEffect(scrollStr: string, wrapperStr: string) {
    const scrollContainer = document.getElementById(scrollStr) as HTMLElement;
    const wrapper = document.getElementById(wrapperStr) as HTMLElement;
    if (!scrollContainer || !wrapper) return;
    const renderFadeEffect = () => {
      const atTop = scrollContainer.scrollTop === 0;
      const atBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop === scrollContainer.clientHeight;
      wrapper.classList.toggle("before:opacity-100", !atTop);
      wrapper.classList.toggle("after:opacity-100", !atBottom);
    };
    scrollContainer.removeEventListener("scroll", renderFadeEffect);
    scrollContainer.addEventListener("scroll", renderFadeEffect);
}

export function animatePopup(popup: HTMLElement, fadeIn: boolean = true, cb?: () => void) {
  const done = () => {
    popup.removeEventListener("transitionend", done);
    if (cb) cb();
  };
  popup.addEventListener("transitionend", done, { once: true });
  popup.classList[fadeIn ? "remove" : "add"]("opacity-0", "pointer-events-none");
  popup.classList[fadeIn ? "add" : "remove"]("opacity-100", "pointer-events-auto", "cursor-pointer");
}