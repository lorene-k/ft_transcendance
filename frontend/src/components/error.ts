export function setFormError(element, msg): boolean {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.input-error-msg');
  
    errorDisplay.innerText = msg;
    element.classList.add('ring-2', 'ring-red-500');
    element.classList.remove('focus:ring-indigo-600', 'border-gray-300');
    return (false);
  }
  
  export function setFormSuccess(element): boolean {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.input-error-msg');
  
    errorDisplay.innerText = '';
    element.classList.add('border-green-300');
    element.classList.remove('ring-2', 'ring-red-500');
    return (true);
  }