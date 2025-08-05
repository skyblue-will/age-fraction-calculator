const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to find best fraction representation
function findBestFraction(decimal, maxDenom = 99) {
  let bestNumerator = 0;
  let bestDenominator = 1;
  let smallestError = 1;

  for (let denom = 1; denom <= maxDenom; denom++) {
    let numerator = Math.round(decimal * denom);
    if (numerator > 99) continue; // Keep numerator under 100
    
    let error = Math.abs(decimal - numerator / denom);
    if (error < smallestError) {
      smallestError = error;
      bestNumerator = numerator;
      bestDenominator = denom;
    }
  }

  // Simplify fraction
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(bestNumerator, bestDenominator);
  
  return {
    numerator: bestNumerator / divisor,
    denominator: bestDenominator / divisor
  };
}

// Calculate age with fraction
function calculateAgeFraction(birthDate) {
  const now = new Date();
  const birth = new Date(birthDate);
  
  // Basic age in years
  let ageYears = now.getFullYear() - birth.getFullYear();
  
  // Adjust if birthday hasn't occurred this year
  const thisYearBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (now < thisYearBirthday) {
    ageYears--;
  }
  
  // Calculate fraction of year passed since last birthday
  const lastBirthday = new Date(now.getFullYear() - (now < thisYearBirthday ? 1 : 0), birth.getMonth(), birth.getDate());
  const nextBirthday = new Date(lastBirthday.getFullYear() + 1, birth.getMonth(), birth.getDate());
  
  const daysSinceBirthday = (now - lastBirthday) / (1000 * 60 * 60 * 24);
  const daysInYear = (nextBirthday - lastBirthday) / (1000 * 60 * 60 * 24);
  const yearFraction = daysSinceBirthday / daysInYear;
  
  // Find best fraction representation
  const fraction = findBestFraction(yearFraction);
  
  return {
    years: ageYears,
    fraction: fraction,
    decimal: ageYears + yearFraction,
    daysSinceBirthday: Math.floor(daysSinceBirthday)
  };
}

// Home page with form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Age Fraction Calculator</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          text-align: center;
        }
        input, button {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        }
        button {
          background: #007bff;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
        .result {
          margin-top: 20px;
          padding: 20px;
          background: #e8f4f8;
          border-radius: 5px;
          text-align: center;
          font-size: 1.2em;
        }
        .age-display {
          font-size: 2em;
          color: #007bff;
          margin: 10px 0;
        }
        .info {
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎂 Age Fraction Calculator</h1>
        <form id="ageForm">
          <label for="dob">Enter Date of Birth:</label>
          <input type="date" id="dob" name="dob" required>
          <button type="submit">Calculate Age</button>
        </form>
        <div id="result"></div>
      </div>
      
      <script>
        document.getElementById('ageForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const dob = document.getElementById('dob').value;
          
          try {
            const response = await fetch('/calculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dob })
            });
            
            const data = await response.json();
            
            let fractionText = '';
            if (data.fraction.numerator === 0) {
              fractionText = data.years + ' years exactly';
            } else {
              fractionText = data.years + ' and ' + data.fraction.numerator + '/' + data.fraction.denominator + ' years';
            }
            
            document.getElementById('result').innerHTML = \`
              <div class="result">
                <div class="age-display">\${fractionText}</div>
                <div class="info">
                  Exact age: \${data.decimal.toFixed(3)} years<br>
                  Days since last birthday: \${data.daysSinceBirthday}
                </div>
              </div>
            \`;
          } catch (error) {
            document.getElementById('result').innerHTML = '<div class="result">Error calculating age</div>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// API endpoint
app.post('/calculate', (req, res) => {
  const { dob } = req.body;
  
  if (!dob) {
    return res.status(400).json({ error: 'Date of birth required' });
  }
  
  try {
    const result = calculateAgeFraction(dob);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid date format' });
  }
});

// JSON API endpoint
app.get('/api/:dob', (req, res) => {
  try {
    const result = calculateAgeFraction(req.params.dob);
    res.json({
      ...result,
      formatted: result.fraction.numerator === 0 
        ? `${result.years} years` 
        : `${result.years} and ${result.fraction.numerator}/${result.fraction.denominator} years`
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid date format' });
  }
});

app.listen(PORT, () => {
  console.log(`Age Fraction Calculator running on port ${PORT}`);
});