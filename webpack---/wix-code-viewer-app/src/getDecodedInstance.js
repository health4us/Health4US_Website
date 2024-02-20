const getDecodedInstance = (signedInstanceString) => {
    const encodedInstance = signedInstanceString.substring(
        signedInstanceString.lastIndexOf('.') + 1,
    );

    return JSON.parse(atob(encodedInstance));
};

module.exports.getDecodedInstance = getDecodedInstance;