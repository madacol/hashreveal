const hashAlgoInput = /** @type {HTMLSelectElement} */ (document.getElementById('hashAlgoInput'));
const hashInput = /** @type {HTMLInputElement} */ (document.getElementById('hashInput'));
const contentInput = /** @type {HTMLTextAreaElement} */ (document.getElementById('contentInput'));
const hashType = /** @type {HTMLElement} */ (document.getElementById('hashType'));
const hashValue = /** @type {HTMLElement} */ (document.getElementById('hashValue'));
const calculatedHash = /** @type {HTMLElement} */ (document.getElementById('calculatedHash'));
const verificationStatus = /** @type {HTMLDivElement} */ (document.getElementById('verificationStatus'));

/**
 * Computes a hash for the given content using specified algorithm
 * @param {string} content
 * @param {AlgorithmIdentifier} hashAlgorithm
 * @returns {Promise<string>}
 */
async function computeHash(content, hashAlgorithm) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const digestBuffer = await crypto.subtle.digest(hashAlgorithm, data);
    const digestArray = Array.from(new Uint8Array(digestBuffer));
    const computedHash = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return computedHash;
}

async function updateUrl(algorithm, hash, content) {
    const params = new URLSearchParams();
    if (hash) params.set('digest', `${algorithm}:${hash}`);
    if (content) params.set('content', content);
    window.location.hash = params.toString();
}

async function updateFromInputs() {
    const hashAlgorithm = hashAlgoInput.value;
    const hash = hashInput.value;
    const contentValue = contentInput.value;

    try {
        if (!contentValue) {
            calculatedHash.textContent = 'N/A';
            updateStatus(false, false);
            return;
        }

        hashType.textContent = hashAlgorithm;
        const computedHash = await computeHash(contentValue, hashAlgorithm);
        calculatedHash.textContent = computedHash;

        if (hash) {
            hashValue.textContent = hash;
            const isValid = computedHash === hash.toLowerCase();
            updateStatus(isValid);
        } else {
            hashValue.textContent = 'N/A';
            updateStatus(false, false);
        }

        await updateUrl(hashAlgorithm, hash, contentValue);
    } catch (error) {
        hashValue.textContent = 'N/A';
        calculatedHash.textContent = 'N/A';
        updateStatus(false, false);
        verificationStatus.textContent = `Error: ${error.message}`;
        verificationStatus.className = 'status invalid';
    }
}

async function parseHash() {
    const hashFragment = window.location.hash.substring(1);
    if (!hashFragment) return;

    const params = new URLSearchParams(hashFragment);
    const digest = params.get('digest');
    const contentValue = params.get('content');

    if (digest && contentValue) {
        const [hashAlgorithm, hash] = digest.split(':', 2);
        hashAlgoInput.value = hashAlgorithm;
        hashInput.value = hash;
        contentInput.value = contentValue;
        await updateFromInputs();
    }
}

/**
 * @param {boolean} isValid
 * @param {boolean} [isVerifying=true]
 */
function updateStatus(isValid, isVerifying = true) {
    verificationStatus.className = 'status';
    
    if (!isVerifying) {
        verificationStatus.textContent = 'Not verified';
        verificationStatus.classList.add('neutral');
    } else {
        verificationStatus.textContent = isValid ? 'Valid ✓' : 'Invalid ✗';
        verificationStatus.classList.add(isValid ? 'valid' : 'invalid');
    }
}

// Setup event listeners
hashAlgoInput.addEventListener('change', updateFromInputs);
hashInput.addEventListener('input', updateFromInputs);
contentInput.addEventListener('input', updateFromInputs);
window.addEventListener('load', parseHash);
window.addEventListener('hashchange', parseHash);