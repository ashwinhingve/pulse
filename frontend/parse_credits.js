const xlsx = require('xlsx'); 

const wb = xlsx.readFile('../credits.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data, null, 2));
