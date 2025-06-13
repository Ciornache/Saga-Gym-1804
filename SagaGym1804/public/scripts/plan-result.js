document.addEventListener('DOMContentLoaded', () => {
    const planData = JSON.parse(sessionStorage.getItem('planData'));
    if (!planData) {
        document.body.innerHTML = '<p>No plan data found.</p>';
        return;
    }
    console.log(planData);
    document.getElementById('training-type').textContent = planData.trainingType;
    document.getElementById('difficulty-level').textContent = planData.difficultyLevel;

    const muscleGroupsList = document.getElementById('muscle-groups');
    planData.muscleGroups.forEach(group => {
        const li = document.createElement('li');
        li.textContent = group;
        muscleGroupsList.appendChild(li);
    });

    const exerciseList = document.getElementById('exercise-list');
    planData.exercises.forEach(exercise => {
        const li = document.createElement('li');
        li.textContent = exercise.name ? exercise.name : JSON.stringify(exercise);
        exerciseList.appendChild(li);
    });
});