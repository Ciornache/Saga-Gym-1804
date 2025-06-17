// Injectez doar doughnut-ul pentru Favorite Muscle Groups
const ctx = document.getElementById('muscleChart').getContext('2d');
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Back', 'Legs', 'Biceps', 'Triceps'],
    datasets: [{
      data: [75, 25, 15, 5],
      backgroundColor: ['#e63946', '#2a9d8f', '#f06292', '#6a4c93']
    }]
  },
  options: {
    cutout: '70%',
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false
  }
});
