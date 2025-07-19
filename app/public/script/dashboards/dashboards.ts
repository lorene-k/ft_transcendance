
declare const Chart: any;

const ctx = document.getElementById('bar-chart') as HTMLCanvasElement | null;

if (!ctx) console.error('Canvas bar-chart element not found'); // ! DEBUG
  new Chart(ctx!, {
    type: 'bar',
    data: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

/* 
1. USER DASHBOARD
- Total games played
- Win rate
- Current win streak
- Longest win streak
- Total goals scored

- Row 1 :
	- Stat = total games played
	- Pie chart = wins vs losses (win rate)
	- Stat = Current win streak (+ below : longest win streak)
- Row 2 : bar chart = games played (y axis) over time (w-axis)
- Row 3 : line graph = win rate progression over time

2. GAME STATISTICS (with filter ?)
- Date & Time
- Mode (1v1 / Tournament)
- Opponent
- Final score
- Result (Win / Loss)
- Duration
- Goals Scored
- Precision (Ratio of successful shots)
*/
