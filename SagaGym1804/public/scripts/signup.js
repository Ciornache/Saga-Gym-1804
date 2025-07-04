const workoutButton = document.getElementById("workout-btn");

workoutButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    alert("Access denied! Please log in to continue.");
    return;
  }

  const res = await fetch("/token/getuser", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200) {
    const data = await res.json();
    window.location.href = `workout.html?id=${data.user_id}`;
  } else {
    console.error("Unauthorized access");
    window.location.href = "login.html";
  }
});

const logoutButton = document.getElementById("logout-btn");
const userAccWindow = document.getElementById("user-win-btn");

document.addEventListener("DOMContentLoaded", async () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const res = await fetch("/token/getuser", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(res);
  if (res.status === 200) {
    logoutButton.classList.remove("hidden");
    userAccWindow.classList.remove("hidden");
  } else {
    logoutButton.classList.add("hidden");
    userAccWindow.classList.add("hidden");
  }
});

logoutButton.addEventListener("click", (e) => {
  localStorage.clear();
  sessionStorage.clear();
  e.target.classList.add("hidden");
  location.reload(true);
});

userAccWindow.addEventListener("click", () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) window.location.href = "account.html";
  else window.location.href = "login.html";
});

const input_elements = [
  document.getElementById("email"),
  document.getElementById("password"),
  document.getElementById("phone-number"),
  document.getElementById("username"),
  document.getElementById("confirm-password"),
];

for (const input_element of input_elements) {
  input_element.addEventListener("focus", (event) => {
    console.log("focus");
    const parentContainer = event.target.closest(".form-flex-item");
    if (parentContainer) {
      parentContainer.classList.remove("input-error");
      parentContainer.classList.remove("input-correct");
      const spanElements = parentContainer.querySelectorAll("span");
      const spanErrorMessage = spanElements[spanElements.length - 1];
      spanErrorMessage.textContent = "";
    }
  });
}

const radio_buttons = document.querySelectorAll(".step2-img-container input");
for (const radio_button of radio_buttons) {
  radio_button.addEventListener("click", (event) => {
    console.log(this, event.target);
    const parentContainer = event.target.closest(".sign-up-step2");
    console.log(parentContainer);
    if (parentContainer) {
      const errorMessage = parentContainer.querySelector(".step-error");
      if (errorMessage) {
        errorMessage.textContent = "";
        errorMessage.classList.add("hidden");
      }
    }
  });
}

let currentStep = 1;
let user = {
  email: "",
  password: "",
  phone_number: "",
  name: "",
  body_type: "",
  interval_varsta: "",
  height: 0,
  weight: 0,
  gender: "",
};

async function checkUserExists(email, username, phone_number, error_count) {
  let count = 0;
  let node_elements = [
    { text: "Email", value: email, error_value: "email" },
    { text: "Name", value: username, error_value: "username" },
    { text: "PhoneNumber", value: phone_number, error_value: "phone number" },
  ];
  for (node_element of node_elements) {
    const response = await fetch(`/validation/getUserBy${node_element.text}`, {
      method: "GET",
      headers: {
        [node_element.text]: node_element.value.value,
      },
    });
    if (response.status === 200) {
      showErrorMessage(
        node_element.value,
        `User with this ${node_element.error_value} already exists`,
        error_count
      );
      count = count + 1;
    }
  }

  return count;
}

async function validateStep1Form() {
  let error_count = { value: 0 };
  console.log("Validating first step");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const phoneInput = document.getElementById("phone-number");
  const usernameInput = document.getElementById("username");
  const confirmPasswordInput = document.getElementById("confirm-password");

  if (isEmailValid(emailInput.value)) {
    showValidMessage(emailInput);
  } else {
    showErrorMessage(emailInput, "Invalid email format", error_count);
  }

  if (usernameInput.value.length < 3)
    showErrorMessage(
      usernameInput,
      "Username must be at least 3 characters",
      error_count
    );
  else if (usernameInput.value === "" || usernameInput.value === null)
    showErrorMessage(usernameInput, "Username cannot be empty", error_count);
  else if (usernameInput.value.length > 20)
    showErrorMessage(
      usernameInput,
      "Username must be at most 20 characters",
      error_count
    );
  else if (usernameInput.value.match(/[^a-zA-Z0-9]/))
    showErrorMessage(
      usernameInput,
      "Username can only contain letters and numbers",
      error_count
    );
  else showValidMessage(usernameInput);

  if (isPhoneNumberValid(phoneInput.value)) {
    showValidMessage(phoneInput);
  } else {
    showErrorMessage(phoneInput, "Invalid phone number format", error_count);
  }

  console.log(passwordInput.value, passwordInput.value.length);
  if (passwordInput.value.length < 8)
    showErrorMessage(
      passwordInput,
      "Password must be at least 8 characters",
      error_count
    );
  else if (passwordInput.value === "" || passwordInput.value === null)
    showErrorMessage(passwordInput, "Password cannot be empty", error_count);
  else if (!isPasswordValid(passwordInput.value)) {
    showErrorMessage(
      passwordInput,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      error_count
    );
  } else if (
    confirmPasswordInput === "" ||
    confirmPasswordInput === null ||
    passwordInput.value !== confirmPasswordInput.value
  ) {
    console.log("Passwords do not match");
    showErrorMessage(
      confirmPasswordInput,
      "Passwords do not match",
      error_count
    );
  } else {
    showValidMessage(passwordInput);
    showValidMessage(confirmPasswordInput);
  }

  if (!error_count.value) {
    error_count.value = await checkUserExists(
      emailInput,
      usernameInput,
      phoneInput,
      error_count
    );
  }

  if (!error_count.value) {
    user.email = emailInput.value;
    user.password = passwordInput.value;
    user.phone_number = phoneInput.value;
    user.name = usernameInput.value;
  }

  return error_count.value === 0;
}

function validateStep2Form() {
  console.log(user);
  let isChecked = false;
  let checked_radio_button = null;
  const radio_buttons = document.querySelectorAll(".step2-img-container input");
  for (radio_button of radio_buttons) {
    isChecked |= radio_button.checked;
    if (isChecked) {
      checked_radio_button = radio_button;
    }
  }

  if (isChecked) {
    user.body_type = checked_radio_button.value;
  } else {
    const errorMessage = document.querySelector(".step-error");
    errorMessage.textContent = "Please select a body type";
    errorMessage.classList.remove("hidden");
  }

  return isChecked;
}

function isPasswordValid(password) {
  let lowerCase = false,
    upperCase = false,
    number = false,
    specialCharacter = false;
  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    if (char >= "a" && char <= "z") lowerCase = true;
    else if (char >= "A" && char <= "Z") upperCase = true;
    else if (char >= "0" && char <= "9") number = true;
    else specialCharacter = true;
  }
  return lowerCase && upperCase && number && specialCharacter;
}

function validateStep3Form() {
  console.log("Validating third step");

  let isChecked = false;
  let checked_radio_button = null;
  const radio_buttons = document.querySelectorAll(
    ".step3-button-wrapper input"
  );
  for (radio_button of radio_buttons) {
    isChecked |= radio_button.checked;
    if (radio_button.checked) {
      checked_radio_button = radio_button;
    }
  }

  if (isChecked) {
    user.interval_varsta = checked_radio_button.value;
  } else {
    const step3_section = document.querySelector(".sign-up-step3");
    const errorMessage = step3_section.querySelector(".step-error");
    errorMessage.textContent = "Please select an age range";
    errorMessage.classList.remove("hidden");
  }

  return isChecked;
}

function toggleCheckAttribute(group, value) {
  if (group === "height-unit") {
    document
      .getElementById("ft-container")
      .classList.toggle("hidden", value !== "ft");
    document
      .getElementById("cm-container")
      .classList.toggle("hidden", value !== "cm");
  } else if (group === "weight-unit") {
    document
      .getElementById("lb-container")
      .classList.toggle("hidden", value !== "lb");
    document
      .getElementById("kg-container")
      .classList.toggle("hidden", value !== "kg");
  }
}

function validateStep4Form(event) {
  event.preventDefault();
  let valid = true;

  const isFt = document.getElementById("ft-radio").checked;
  let heightValue = 0;

  if (isFt) {
    const ft = document.getElementById("ft").value;
    const inch = document.getElementById("in").value;
    if (!ft || !inch) {
      valid = false;
      document.getElementById("height-error").classList.remove("hidden");
    } else {
      document.getElementById("height-error").classList.add("hidden");
      heightValue = ft * 30.48 + inch * 2.54;
    }
  } else {
    const cm = document.getElementById("cm").value;
    if (!cm) {
      valid = false;
      document.getElementById("height-error").classList.remove("hidden");
    } else {
      document.getElementById("height-error").classList.add("hidden");
      heightValue = cm;
    }
  }

  const isLb = document.getElementById("lb-radio").checked;
  const weightValue = isLb
    ? document.getElementById("lb").value
    : document.getElementById("kg").value;
  if (!isWeightValid(weightValue)) {
    valid = false;
    document.getElementById("weight-error").classList.remove("hidden");
  } else {
    document.getElementById("weight-error").classList.add("hidden");
  }

  const genderChecked = document.querySelector('input[name="gender"]:checked');
  if (!genderChecked) {
    valid = false;
    document.getElementById("gender-error").classList.remove("hidden");
  } else {
    document.getElementById("gender-error").classList.add("hidden");
  }

  if (valid) {
    user.height = heightValue;
    user.weight = parseFloat(weightValue);
    user.gender = genderChecked.value;
    fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    alert("Form valid. Submitting!");
    window.location.href = "login.html";
  }
}

function isWeightValid(weight) {
  for (let i = 0; i < weight.length; i++) {
    if (weight[i] < "0" || weight[i] > "9") {
      return false;
    }
  }
  return true;
}
function showErrorMessage(inputElement, message, error_count) {
  const parentContainer = inputElement.parentElement.parentElement;
  parentContainer.classList.remove("input-correct");
  parentContainer.classList.add("input-error");
  const spanElements = parentContainer.querySelectorAll("span");
  const spanErrorMessage = spanElements[spanElements.length - 1];
  spanErrorMessage.textContent = message;
  error_count.value++;
}

function showValidMessage(inputElement) {
  const parentContainer = inputElement.parentElement.parentElement;
  parentContainer.classList.remove("input-error");
  parentContainer.classList.add("input-correct");
  const spanElements = parentContainer.querySelectorAll("span");
  const spanErrorMessage = spanElements[spanElements.length - 1];
  spanErrorMessage.textContent = "";
}

function isEmailValid(email) {
  let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function isPhoneNumberValid(phone) {
  return /^\+?[0-9\s\-().]{7,}$/.test(phone);
}

async function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      const isValid = await validateStep1Form();
      return isValid;
    case 2:
      return validateStep2Form();
    case 3:
      return validateStep3Form();
    default:
      console.error("Invalid step");
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

window.showCurrentStep = function (value) {
  if (value === 1) {
    let isValid = validateCurrentStep().then((isValid) => {
      console.log("isValid", isValid);
      if (isValid) {
        sleep(500).then(() => {
          continueToNextStep(value);
        });
      } else {
        console.error("Validation failed");
      }
    });
    console.log("isValid", isValid);
    if (!isValid) {
      console.error("Validation failed");
      return;
    }
  } else {
    continueToNextStep(value);
  }
};

function continueToNextStep(value) {
  currentStep += value;
  let allPageSections = document.querySelectorAll(
    'section[class^="sign-up-step"]'
  );
  console.log("All page sections:", allPageSections);
  console.log("All page sections length:", allPageSections.length);
  for (section of allPageSections) {
    section.classList.add("hidden");
  }
  const nextStep = document.querySelector(
    `section[class^="sign-up-step${currentStep}"]`
  );
  console.log(nextStep);
  if (!nextStep) {
    console.error(`No section found for step ${currentStep}`);
    return;
  }
  nextStep.classList.remove("hidden");
}

function togglePasswordVisibility(element_id) {
  const passwordInput = document.getElementById(element_id);
  if (!passwordInput) {
    console.error(`Element with id ${element_id} not found`);
    return;
  }
  const index = element_id === "password" ? 0 : 1;
  const passwordToggle =
    document.getElementsByClassName("toggle-password")[index];
  if (!passwordToggle) {
    console.error(`Element with class toggle-password not found`);
    return;
  }
  const passwordType =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", passwordType);
  passwordToggle.classList.toggle("toggle-password-visible");
}

function toggleCheckAttribute(radio_button_name, radio_button_value) {
  const radioButtons = document.getElementsByName(radio_button_name);
  for (radio_button of radioButtons) {
    const divAttribute = document.getElementById(
      `${radio_button.value}-container`
    );
    console.log(
      divAttribute,
      radio_button.value,
      `${radio_button.value}-container`
    );
    if (!divAttribute) {
      console.error(
        `Element with id ${radio_button.value}-container not found`
      );
      continue;
    }
    const divAttributeElements = divAttribute.getElementsByTagName("*");
    for (element of divAttributeElements) {
      if (element.tagName === "INPUT") element.value = "";
    }
    if (radio_button_value !== radio_button.value) {
      radio_button.checked = false;
      divAttribute.classList.add("hidden");
    } else {
      radio_button.checked = true;
      divAttribute.classList.remove("hidden");
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
});
