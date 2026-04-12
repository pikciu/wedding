#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printUsage() {
    console.log('Usage: node scripts/generate-guest-links.js --domain <domain> --password <password> [--input <path>] [--output <path>]');
    console.log('Example: node scripts/generate-guest-links.js --domain example.pl --password test1234');
}

function parseArgs(argv) {
    const args = {};

    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith('--')) continue;

        const key = token.slice(2);
        const next = argv[i + 1];

        if (!next || next.startsWith('--')) {
            args[key] = true;
            continue;
        }

        args[key] = next;
        i += 1;
    }

    return args;
}

function getDisplayName(guest) {
    if (!guest || !Array.isArray(guest.names)) return '';

    const names = guest.names
        .filter((name) => typeof name === 'string' && name.trim())
        .map((name) => name.trim());

    return names.join(' & ');
}

function generateRows(guests, baseDomain, hashPassword) {
    const entries = Object.entries(guests || {});
    const rows = entries.map(([guestKey, guest]) => {
        const displayName = getDisplayName(guest) || '(bez nazwy)';
        const link = baseDomain + '?g=' + encodeURIComponent(guestKey) + '#' + encodeURIComponent(hashPassword);
        return { displayName, link };
    });

    const maxLen = rows.reduce((acc, row) => Math.max(acc, row.displayName.length), 0);

    return rows.map((row) => row.displayName.padEnd(maxLen + 2, ' ') + row.link);
}

function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        printUsage();
        process.exit(0);
    }

    const domain = args.domain;
    const password = args.password;

    if (!domain || !password) {
        printUsage();
        console.error('Error: --domain and --password are required.');
        process.exit(1);
    }

    const baseDomain = String(domain);

    const inputPath = args.input
        ? path.resolve(process.cwd(), String(args.input))
        : path.join(__dirname, '..', 'data', 'wedding-data.json');

    if (!fs.existsSync(inputPath)) {
        console.error('Error: input file not found: ' + inputPath);
        process.exit(1);
    }

    let json;
    try {
        json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } catch (error) {
        console.error('Error: cannot parse JSON file:', error.message);
        process.exit(1);
    }

    if (!json || typeof json !== 'object' || !json.guests || typeof json.guests !== 'object') {
        console.error('Error: JSON does not contain a valid "guests" object.');
        process.exit(1);
    }

    const lines = generateRows(json.guests, baseDomain, password);
    const output = lines.join('\n') + '\n';

    if (args.output) {
        const outputPath = path.resolve(process.cwd(), String(args.output));
        fs.writeFileSync(outputPath, output, 'utf8');
        console.log('Generated ' + lines.length + ' links.');
        console.log('Saved to: ' + outputPath);
        return;
    }

    process.stdout.write(output);
}

main();