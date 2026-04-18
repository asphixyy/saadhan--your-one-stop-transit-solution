const fs = require('fs');

const sources = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru'];
const destinations = ['Ahmedabad', 'Pune', 'Hyderabad', 'Jaipur', 'Lucknow'];
const levelsOfTraffic = ['Low', 'Medium', 'High'];
const timesOfDay = ['Morning', 'Afternoon', 'Evening', 'Night'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weatherConditions = ['Clear', 'Rain', 'Storm', 'Fog'];
const roadTypes = ['Highway', 'City', 'Rural'];
const routeIDs = ['A', 'B', 'C'];

const generateRow = () => {
    const src = sources[Math.floor(Math.random() * sources.length)];
    const dest = destinations[Math.floor(Math.random() * destinations.length)];
    const dist = Math.floor(Math.random() * 2000) + 100;
    const traffic = levelsOfTraffic[Math.floor(Math.random() * levelsOfTraffic.length)];
    const time = timesOfDay[Math.floor(Math.random() * timesOfDay.length)];
    const day = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
    const weekend = (day === 'Saturday' || day === 'Sunday') ? 'Yes' : 'No';
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const road = roadTypes[Math.floor(Math.random() * roadTypes.length)];
    const route = routeIDs[Math.floor(Math.random() * routeIDs.length)];
    
    // Average speed (km/h) based on traffic
    let speed = 60;
    if (traffic === 'High') speed = 30;
    else if (traffic === 'Low') speed = 80;
    
    if (weather === 'Storm' || weather === 'Fog') speed -= 15;
    
    const travelTime = (dist / speed).toFixed(2);
    
    // Delay flag
    const delayFlag = (traffic === 'High' || weather === 'Storm' || weather === 'Fog') ? 1 : 0;
    
    return `${src},${dest},${dist},${traffic},${time},${day},${weekend},${weather},${road},${route},${speed},${travelTime},${delayFlag}`;
};

const rows = ['Source,Destination,Distance,Traffic_Level,Time_of_Day,Day_of_Week,Weekend,Weather,Road_Type,Route_ID,Average_Speed,Travel_Time_Hours,Delay_Flag'];

for(let i=0; i<10000; i++) {
    rows.push(generateRow());
}

if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
}

fs.writeFileSync('./public/dataset.csv', rows.join('\n'));
console.log("Successfully generated public/dataset.csv");
