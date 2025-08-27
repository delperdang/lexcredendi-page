const fs = require('fs');

function parseCSVToObjects(csvText) {
	const lines = csvText.trim().split('\n');
	const headers = lines[0].split(',').map(h => h.trim());
	const records = [];
	for (let i = 1; i < lines.length; i++) {
		const values = lines[i]
			.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
			.map(v => v.trim().replace(/^"|"$/g, ''));
		if (values.length === headers.length) {
			const record = {};
			headers.forEach((h, idx) => {
				record[h] = values[idx];
			});
			records.push(record);
		}
	}
	return records;
}

function replaceCsvBlockWithJsonVariable(source, varNameCsv, varNameJson) {
	const re = new RegExp(
		`(^[\t ]*const[\t ]+${varNameCsv}[\t ]*=[\t ]*\
\`([\\s\\S]*?)\
\`;\s*)`,
		'm'
	);
	const match = source.match(re);
	if (!match) return source;
	const fullMatch = match[0];
	const indent = (fullMatch.match(/^([\t ]*)/) || ['',''])[1];
	const csvText = match[2];
	const jsonArray = parseCSVToObjects(csvText);
	const jsonInline = JSON.stringify(jsonArray);
	const replacement = `${indent}const ${varNameJson} = ${jsonInline};\n`;
	return source.replace(re, replacement);
}

function replaceUsage(source, varNameCsv, varNameJson) {
	return source.replace(new RegExp(`parseCSV\\(${varNameCsv}\\)`, 'g'), varNameJson);
}

function removeParseCsvFunction(source) {
	// Remove the entire parseCSV function block
	const re = /\n[\t ]*function[\t ]+parseCSV\s*\([\s\S]*?\n[\t ]*}\n/;
	return source.replace(re, '\n');
}

function run() {
	const filePath = '/workspace/index.html';
	let src = fs.readFileSync(filePath, 'utf8');

	const mappings = [
		{ csv: 'prayerDataCSV', json: 'prayerData' },
		{ csv: 'apologeticsDataCSV', json: 'apologeticsData' },
		{ csv: 'doctrineDataCSV', json: 'doctrineData' },
		{ csv: 'bibleInYearDataCSV', json: 'bibleInYearData' },
		{ csv: 'catechismInYearDataCSV', json: 'catechismInYearData' },
	];

	for (const m of mappings) {
		src = replaceCsvBlockWithJsonVariable(src, m.csv, m.json);
	}

	for (const m of mappings) {
		src = replaceUsage(src, m.csv, m.json);
	}

	// Remove the parseCSV function
	src = removeParseCsvFunction(src);

	fs.writeFileSync(filePath, src, 'utf8');
}

run();

