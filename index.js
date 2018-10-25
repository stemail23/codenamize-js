const crypto = require('crypto');
const bigInt = require('big-integer');
const adjectives = require('./adjectives.json');
const nouns = require('./nouns.json');

function findLengths(items) {
	const lengths = [3, 4, 5, 6, 7, 8, 9];
	const response = {};
	items.forEach(function(item) {
		lengths.forEach(function(length) {
			if (item.length <= length) {
				response[length] = response[length] ? response[length] + 1 : 1;
			}
		});
	});
	return response;
}

adjectives.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length));
const adjectiveLengths = findLengths(adjectives);
nouns.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length));
const nounLengths = findLengths(nouns);

function isObject(obj) {
    return typeof obj === 'object' && !!obj;
}

function isString(obj) {
	return Object.prototype.toString.call(obj) === '[object String]';
}

function isNumber(obj) {
	return Object.prototype.toString.call(obj) === '[object Number]';
}

function parseOptions(options) {
	const response = {};

	response.maxItemChars = options && isNumber(options.maxItemChars) && options.maxItemChars > 0 ? Math.max(3, options.maxItemChars) : 0;
	if (response.maxItemChars > 9 || !response.maxItemChars) {
		delete response.maxItemChars;
	}
	response.adjectiveCount = options && isNumber(options.adjectiveCount) ? options.adjectiveCount : 0;
	if (!response.adjectiveCount) {
		delete response.adjectiveCount;
	}

	response.seed = (options && options.seed) || '';
	if (isNumber(response.seed)) {
		response.seed = response.seed.toString();
	} else if (isObject(response.seed)) {
		response.seed = JSON.stringify(response.seed);
	}

	response.hashAlgorithm = options && isString(options.hashAlgorithm) ? options.hashAlgorithm : 'md5';
	response.separator = options && isString(options.separator) ? options.separator : '-';

	return response;
}

function codenameParticles(options) {
	const useOptions = parseOptions(options);

	// Prepare codename word lists and calculate size of codename space
	const useNouns = useOptions.maxItemChars ? nouns.slice(0, nounLengths[useOptions.maxItemChars]) : nouns;
	const useAdjectives = useOptions.maxItemChars ? adjectives.slice(0, adjectiveLengths[useOptions.maxItemChars]) : adjectives;
	const particles = [useNouns];
	for (let i = 0; i < (useOptions.adjectiveCount || 1); i++) {
		particles.push(useAdjectives);
	}
	const totalWords = bigInt(useAdjectives.length)
		.pow(useOptions.adjectiveCount || 1)
		.multiply(bigInt(useNouns.length));

	const hash = crypto.createHash(useOptions.hashAlgorithm);
	hash.update(useOptions.seed);
	const hashDigest = hash.digest('hex');
	const objHash = bigInt(hashDigest, 16).multiply('36413321723440003717');

	// Calculate codename words
	let index = objHash.mod(totalWords);
	const codenameParticles = [];
	particles.forEach(function(particle) {
		codenameParticles.push(particle[index.mod(particle.length).toJSNumber()]);
		index = index.divide(particle.length);
	});
	codenameParticles.reverse();

	return codenameParticles;
}

function codenamize(options) {
	const useOptions = parseOptions(options);

	let particles = codenameParticles(useOptions);

	if (useOptions.capitalize) {
		particles = particles.map(particle => particle.charAt(0).toUpperCase() + particle.substring(1));
	}

	return particles.join(useOptions.separator);
}

module.exports = codenamize;
