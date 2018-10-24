const crypto = require('crypto');
const bigInt = require('big-integer');

function codenamize(seed, adjectiveCount, maxItemChars, space, capitalize, hashAlgorithm) {
	seed = (seed || '').toString();
	hashAlgorithm = hashAlgorithm || 'md5';
	const totalWords = 1701900; // TODO: calculate correctly
	const hash = crypto.createHash(hashAlgorithm);
	hash.update(seed);
	const hashDigest = hash.digest('hex');
	const objHash = bigInt(hashDigest, 16).multiply('36413321723440003717');
	const index = objHash.mod(totalWords).toJSNumber();
	return index;
}

module.exports = codenamize;
