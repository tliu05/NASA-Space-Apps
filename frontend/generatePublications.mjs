// generatePublications.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build path to CSV in the sibling backend folder
const csvPath = path.join(__dirname, '../backend/results_pruned.csv');

// Read CSV
const csvFile = fs.readFileSync(csvPath, 'utf8');

// Parse CSV
const parsed = Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true,
});

// Map rows to objects
const publications = parsed.data.map((row, index) => {
  const { Title, Link, ...keywordColumns } = row;
  const keywords = Object.keys(keywordColumns).filter(
    key => Number(keywordColumns[key]) === 1
  );
  return {
    id: index + 1,
    title: Title,
    link: Link,
    keywords: keywords,
  };
});

// Output publications.js to frontend/src
const outputPath = path.join(__dirname, '../frontend/src/publications.js');
fs.writeFileSync(
  outputPath,
  `const publications = ${JSON.stringify(publications, null, 2)};\nexport default publications;`
);

console.log('✅ publications.js created successfully at frontend/src/');
