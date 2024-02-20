const enrichUrl = (baseUrl, extraParams) => {
    const extraQueryParams = Object.keys(extraParams)
        .reduce((acc, key) => [...acc, `${key}=${extraParams[key]}`], [])
        .join('&');

    const delimeter = baseUrl.includes('?') ? '&' : '?';

    return `${baseUrl}${delimeter}${extraQueryParams}`;
};

module.exports = {
    enrichUrl,
};