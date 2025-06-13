function updateMuscleGroupSelects() {
    const allSelects = document.querySelectorAll('select[name="muscle-group[]"]');
    const selectedValues = Array.from(allSelects)
        .map(select => select.value)
        .filter(value => value !== 'select');

    allSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value !== select.value && selectedValues.includes(option.value)) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        });
    });
}

document.getElementById('difficulty-level').addEventListener('input', function() {
    document.getElementById('difficulty-value').textContent = this.value;
});

document.getElementById('muscle-group-1').addEventListener('change', updateMuscleGroupSelects);

document.getElementById('add-muscle-group').addEventListener('click', function() {
    const container = document.getElementById('muscle-group-container');
    const existingSelects = container.querySelectorAll('select[name="muscle-group[]"]');

    if (existingSelects.length >= 7) {
        return;
    }

    const groups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs'];
    const currentSelections = Array.from(existingSelects)
        .map(s => s.value)
        .filter(value => value !== 'select');

    const defaultValue = groups.find(g => !currentSelections.includes(g)) || 'select';

    const count = existingSelects.length + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'additional-muscle-group';

    const label = document.createElement('label');
    label.setAttribute('for', 'muscle-group-' + count);
    label.textContent = 'Muscle Group:';

    const select = document.createElement('select');
    select.id = 'muscle-group-' + count;
    select.name = 'muscle-group[]';

    const promptOption = document.createElement('option');
    promptOption.value = 'select';
    promptOption.textContent = 'Select A Muscle Group';
    select.appendChild(promptOption);

    groups.forEach(function(group) {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group.charAt(0).toUpperCase() + group.slice(1);
        select.appendChild(option);
    });

    select.value = defaultValue;

    select.addEventListener('change', updateMuscleGroupSelects);

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    container.appendChild(wrapper);

    updateMuscleGroupSelects();

    if (container.querySelectorAll('select[name="muscle-group[]"]').length >= 7) {
        document.getElementById('add-muscle-group').disabled = true;
    }

});
document.getElementById('submit-btn').addEventListener('click', function(event) {
    event.preventDefault();

    const trainingType = document.getElementById('training-type').value;
    const difficultyLevel = document.getElementById('difficulty-level').value;
    const muscleGroups = Array.from(document.getElementsByName('muscle-group[]')).map(select => select.value);

    const payload = { trainingType, difficultyLevel, muscleGroups };

    fetch('/api/exercises', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Exercises:', data);
            sessionStorage.setItem('planData', JSON.stringify({ ...payload, exercises: data }));
            window.location.href = 'plan-result.html';
        })
        .catch(error => {
            console.error('Error fetching exercises:', error);
        });
});
