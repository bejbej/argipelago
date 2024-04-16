function toDictionary(array, keyFunc) {
    return array.reduce((dictionary, item) => {
        dictionary[keyFunc(item)] = item;
        return dictionary;
    }, {});
}

module.exports = {
    toDictionary
};