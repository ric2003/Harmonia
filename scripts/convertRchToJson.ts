const fs = require('fs');
const path = require('path');
const { parseRchFile } = require('../src/utils/rchParser');

const projectRoot = path.resolve(__dirname, '..');
const RCH_DIR = path.join(projectRoot, 'public', 'SeriesTemporaisCaudais');
const JSON_DIR = path.join(projectRoot, 'public', 'data');

// Ensure the output directory exists
if (!fs.existsSync(JSON_DIR)) {
  fs.mkdirSync(JSON_DIR, { recursive: true });
}

// Convert all RCH files to JSON
async function convertRchFiles() {
  try {
    // Read all RCH files
    const files = fs.readdirSync(RCH_DIR);
    const rchFiles = files.filter((file: string) => file.endsWith('.rch'));

    console.log(`Found ${rchFiles.length} RCH files to convert...`);

    for (const rchFile of rchFiles) {
      const locationId = rchFile.replace('.rch', '');
      const rchPath = path.join(RCH_DIR, rchFile);
      const jsonPath = path.join(JSON_DIR, `${locationId}.json`);

      console.log(`Converting ${rchFile}...`);

      // Read and parse RCH file
      const rchContent = fs.readFileSync(rchPath, 'utf-8');
      const parsedData = parseRchFile(rchContent);

      // Write JSON file
      fs.writeFileSync(jsonPath, JSON.stringify(parsedData, null, 2));
      console.log(`✓ Created ${jsonPath}`);
    }

    console.log('\nConversion complete! All RCH files have been converted to JSON.');
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

convertRchFiles(); 