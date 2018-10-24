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

function codenameParticles(seed, adjectiveCount, maxItemChars, hashAlgorithm) {
    // Minimum length of 3 is required
    maxItemChars = maxItemChars > 0 ? Math.max(3, maxItemChars) : 0;
    if (maxItemChars > 9) { maxItemChars = 0; }

    // Prepare codename word lists and calculate size of codename space
    const useNouns = maxItemChars > 0 ? nouns.slice(0, nounLengths[maxItemChars]) : nouns;
    const useAdjectives = maxItemChars > 0 ? adjectives.slice(0, adjectiveLengths[maxItemChars]) : adjectives;
	const particles = [useNouns];
	for (let i = 0; i < adjectiveCount; i++) { particles.push(useAdjectives); }

	const totalWords = bigInt(useAdjectives.length).pow(adjectiveCount).multiply(bigInt(useNouns.length));

	// Convert seed to string
	seed = (seed || '').toString();
	hashAlgorithm = hashAlgorithm || 'md5';

	const hash = crypto.createHash(hashAlgorithm);
	hash.update(seed);
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

function codenamize(seed, adjectiveCount, maxItemChars, separator, capitalize, hashAlgorithm) {
	let particles = codenameParticles(seed, adjectiveCount, maxItemChars, hashAlgorithm);

	separator = separator || '';
	if (capitalize) {
		particles = particles.map(particle => particle.charAt(0).toUpperCase() + particle.substring(1));
	}

	return particles.join(separator);
}

module.exports = codenamize;
