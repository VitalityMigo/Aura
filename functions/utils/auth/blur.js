// Import the Redis client

// Génère un ID d'authentification Blur
function generateAuthId(address) {
    return `blur-auth-challenge:${address.toLowerCase()}`
}

// Save a Blur authentication challenge to Redis
const saveAuthChallenge = async (id, authChallenge, expiresIn) => {
  const serializedChallenge = JSON.stringify(authChallenge);

  // Check if expiresIn is 0, use KEEPTTL, otherwise use EX with the specified expiration time
  const command = expiresIn === 0 ? 'KEEPTTL' : ['EX', expiresIn];

  await redis.set(id, serializedChallenge, command);
};

// Retrieve a Blur authentication challenge from Redis based on its ID
const getAuthChallenge = async (id) => {
  const serializedChallenge = await redis.get(id);

  // Parse the JSON if the challenge exists
  return serializedChallenge ? JSON.parse(serializedChallenge) : undefined;
};


// Generate an ID for Blur authentication data
const getAuthId = (taker) => `blur-auth:${taker}`;

// Save Blur authentication data (access token) to Redis
const saveAuth = async (id, auth, expiresIn) => {
  const serializedAuth = JSON.stringify(auth);

  // Check if expiresIn is 0, use KEEPTTL, otherwise use EX with the specified expiration time
  const command = expiresIn === 0 ? 'KEEPTTL' : ['EX', expiresIn];

  await redis.set(id, serializedAuth, command);
};

// Retrieve Blur authentication data (access token) from Redis based on its ID
const getAuth = async (id) => {
  const serializedAuth = await redis.get(id);

  // Parse the JSON if the authentication data exists
  return serializedAuth ? JSON.parse(serializedAuth) : undefined;
};

// Export the functions
module.exports = {
 // getAuthChallengeId,
  saveAuthChallenge,
  getAuthChallenge,
  getAuthId,
  saveAuth,
  getAuth,
};

async function x() {

    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json'},
        body: JSON.stringify({
            walletAddress : "0x6a7AdEf8413097720381654fc71a2da8A179cB5C"
        })
    };


    // On fait le fetch
    fetch('https://core-api.prod.blur.io/auth/challenge', options)
        .then(async response => {
console.log(response)
            const call = await response.json()

            console.log(call)
        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                requestId: null,
                orderId: null,
                path: null,
                data: null,
                fees: null,
            }
        });

}

x()