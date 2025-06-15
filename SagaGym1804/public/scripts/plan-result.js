const workoutButton = document.querySelector(
  ".navbar .navbar-button:nth-child(4)"
);

workoutButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    console.log("Access denied!");
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

document.addEventListener("DOMContentLoaded", () => {
  const planData = JSON.parse(sessionStorage.getItem("planData"));
  if (!planData) {
    document.body.innerHTML = "<p>No plan data found.</p>";
    return;
  }
  console.log(planData);
  document.getElementById("training-type").textContent = planData.trainingType;
  document.getElementById("difficulty-level").textContent =
    planData.difficultyLevel;

  const muscleGroupsList = document.getElementById("muscle-groups");
  planData.muscleGroups.forEach((group) => {
    const li = document.createElement("li");
    li.textContent = group;
    muscleGroupsList.appendChild(li);
  });

  const exerciseList = document.getElementById("exercise-list");
  planData.exercises.forEach((exercise) => {
    const li = document.createElement("li");
    li.textContent = exercise.name ? exercise.name : JSON.stringify(exercise);
    exerciseList.appendChild(li);
  });
});
