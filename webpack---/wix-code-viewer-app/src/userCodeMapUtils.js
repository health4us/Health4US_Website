const userCodeMapToUrls = (userCodeMap) =>
    userCodeMap.map(({
        url
    }) => new URL(url));

const userCodeMapToSearchParamsMap = (userCodeMap) => {
    const allSearchParams = userCodeMapToUrls(userCodeMap)
        .map((url) => Array.from(url.searchParams.entries()))
        .flat();

    return new Map(allSearchParams);
};

module.exports = {
    userCodeMapToSearchParamsMap,
};