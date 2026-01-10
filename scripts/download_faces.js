const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to asset-data.js
const assetDataPath = path.join(__dirname, 'blueprint', 'asset-data.js');
const outputDir = path.join(__dirname, '..', 'assets', 'mob-heads');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    console.log(`Creating directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
}

// Read asset-data.js to find MC_ENTITIES
const assetDataContent = fs.readFileSync(assetDataPath, 'utf8');
const match = assetDataContent.match(/const MC_ENTITIES = \[([\s\S]*?)\];/);

if (!match) {
    console.error('Could not find MC_ENTITIES in asset-data.js');
    process.exit(1);
}

// Parse the array
const entitiesString = '[' + match[1] + ']';
const entities = eval(entitiesString);

console.log(`Found ${entities.length} entities.`);

function toPascalCase(str) {
    return str.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

// Special cases map
const wikiNames = {
    'allay': 'Allay',
    'armor_stand': 'ArmorStand',
    'axolotl': 'Axolotl',
    'bat': 'Bat',
    'bee': 'Bee',
    'wither_skeleton': 'WitherSkeleton',
    'zombified_piglin': 'ZombifiedPiglin',
    'command_block_minecart': 'CommandBlockMinecart',
};

function downloadCurl(url, dest) {
    try {
        // Use -L for redirects, -A for User-Agent
        execSync(`curl.exe -L -A "Mozilla/5.0" -o "${dest}" "${url}"`, { stdio: 'ignore' });
        // Check if file exists and has size > 0
        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            return true;
        }
    } catch (e) {
        // Ignore curl errors (non-zero exit)
    }
    return false;
}

async function processEntities() {
    let success = 0;
    for (const entity of entities) {
        let wikiName = wikiNames[entity] || toPascalCase(entity);
        const url = `https://minecraft.wiki/images/${wikiName}Face.png`;
        const dest = path.join(outputDir, `${entity}.png`);

        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            // console.log(`Skipping ${entity} (already exists)`);
            success++;
            continue;
        }

        const result = downloadCurl(url, dest);
        if (result) {
            console.log(`Downloaded: ${entity}`);
            success++;
            // Small delay to be polite even with curl
            await new Promise(r => setTimeout(r, 200));
        } else {
            // console.warn(`Failed: ${entity}`);
            if (fs.existsSync(dest)) fs.unlinkSync(dest); // Cleanup empty/failed
        }
    }
    console.log(`Finished. Total downloaded/existing: ${success}/${entities.length}`);
}

processEntities();
