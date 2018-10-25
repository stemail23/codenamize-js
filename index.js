const crypto = require('crypto');
const bigInt = require('big-integer');
const adjectives = require('./adjectives.json');
const nouns = require('./nouns.json');

function findLengths(items) {
	const lengths = [3,4,5,6,7,8,9];
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

adjectives.sort((a, b) => a.length === b.length ? a.localeCompare(b) : a.length - b.length);
const adjectiveLengths = findLengths(adjectives);
nouns.sort((a, b) => a.length === b.length ? a.localeCompare(b) : a.length - b.length);
const nounLengths = findLengths(nouns);

function codenameParticles(options) {
	if (!options || typeof options !== 'object') {
		options = {};
	}
	options.maxItemChars = options.maxItemChars > 0 ? Math.max(3, options.maxItemChars) : 0;
	if (options.maxItemChars > 9) { options.maxItemChars = 0; }
	options.adjectiveCount = options.adjectiveCount || 1;
	options.seed = (options.seed || '').toString();
	options.hashAlgorithm = options.hashAlgorithm || 'md5';

	// Prepare codename word lists and calculate size of codename space
	const useNouns = options.maxItemChars > 0 ? nouns.slice(0, nounLengths[options.maxItemChars]) : nouns;
	const useAdjectives = options.maxItemChars > 0 ? adjectives.slice(0, adjectiveLengths[options.maxItemChars]) : adjectives;
	const particles = [useNouns];
	for (let i = 0; i < options.adjectiveCount; i++) { particles.push(useAdjectives); }
	const totalWords = bigInt(useAdjectives.length).pow(options.adjectiveCount).multiply(bigInt(useNouns.length));

	const hash = crypto.createHash(options.hashAlgorithm);
	hash.update(options.seed);
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
	if (!options || typeof options !== 'object') {
		options = {};
	}
	options.separator = options.separator || '-';

	let particles = codenameParticles(options);

	if (options.capitalize) {
		particles = particles.map(particle => particle.charAt(0).toUpperCase() + particle.substring(1));
	}

	return particles.join(options.separator);
}

module.exports = codenamize;
