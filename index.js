const crypto = require('crypto');
const _ = require('underscore');
const bigInt = require('big-integer');
const allParticles = {};

function parseParticles(particles) {
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

	_(particles).forEach(function(value, key) {
		allParticles[key] = {
			items: value.sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length)),
			metadata: {
				lengths: findLengths(value)
			}
		};
	});
	return allParticles;
}
parseParticles(require('./particles'), allParticles);

function parseOptions(options) {
	if (options._isParsed) {
		return options;
	}
	const response = {};

	response.maxItemChars = options && _.isNumber(options.maxItemChars) && options.maxItemChars > 0 ? Math.max(3, options.maxItemChars) : 0;
	if (response.maxItemChars > 9 || !response.maxItemChars) {
		delete response.maxItemChars;
	}
	if (options && _.isArray(options.particles)) {
		response.particles = Array.from(options.particles);
	} else {
		// classic mode
		response.particles = options && _.isNumber(options.adjectiveCount) ? new Array(options.adjectiveCount).fill('adjective') : ['adjective'];
		response.particles.push('noun');
	}

	response.seed = (options && options.seed) || '';
	if (_.isNumber(response.seed)) {
		response.seed = response.seed.toString();
	} else if (_.isObject(response.seed)) {
		response.seed = JSON.stringify(response.seed);
	}

	response.hashAlgorithm = options && _.isString(options.hashAlgorithm) ? options.hashAlgorithm : 'md5';
	response.separator = options && _.isString(options.separator) ? options.separator : '-';

	if (options && options.capitalize === true) {
		response.capitalize = options.capitalize;
	}

	response._isParsed = true;
	return response;
}

function getParticles(options) {
	const useOptions = parseOptions(options);

	const response = [];
	useOptions.particles.reverse();
	useOptions.particles.forEach(function(particle) {
		response.push(useOptions.maxItemChars ? allParticles[particle].items.slice(0, allParticles[particle].metadata.lengths[useOptions.maxItemChars]) : allParticles[particle].items);
	});
	return response;
}

function getTotalWords(particles) {
	let totalWords = bigInt(1);
	particles.forEach(function(particle) {
		totalWords = totalWords.multiply(bigInt(particle.length));
	});
	return totalWords;
}

function getHash(options) {
	const useOptions = parseOptions(options);

	const hash = crypto.createHash(useOptions.hashAlgorithm);
	hash.update(useOptions.seed);
	const hashDigest = hash.digest('hex');
	return bigInt(hashDigest, 16).multiply('36413321723440003717');
}

function codenameParticles(options) {
	const useOptions = parseOptions(options);

	const particles = getParticles(useOptions);
	const totalWords = getTotalWords(particles);
	const objHash = getHash(useOptions);

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
