const register_button = document.getElementById('register_btn');

register_button?.addEventListener('click', function handleClick(_) {

    const email = (document?.getElementById('email') as HTMLInputElement)?.value;
    const password = (document?.getElementById('password') as HTMLInputElement)?.value;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", 'http://127.0.0.1:8080/register', true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = () => { // Call a function when the state changes.
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            location.assign("http://127.0.0.1:3000/game")
        }
    }
    xhr.send(`email=${email}&password=${password}`);
});

