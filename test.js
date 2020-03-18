let { Notpromise } = require('./notpromise')

module.exports = {
    resolved: Notpromise.resolve,
    rejected: Notpromise.reject,
    deferred: function () {
        const defer = {};
        defer.promise = new Notpromise(function (resolve, reject) {
            defer.resolve = resolve;
            defer.reject = reject;
        });
        return defer;
    }
};