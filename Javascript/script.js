const login = 'Director'; // Change this value to test different cases
let messsage = (login == 'Employee' ? 'Hello' : login == 'Director' ? 'Greetings' : login == '' ? 'No login' : '');
console.log(messsage);