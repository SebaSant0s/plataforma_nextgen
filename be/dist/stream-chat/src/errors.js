"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIErrorCodes = void 0;
exports.isAPIError = isAPIError;
exports.isErrorRetryable = isErrorRetryable;
exports.isConnectionIDError = isConnectionIDError;
exports.isWSFailure = isWSFailure;
exports.isErrorResponse = isErrorResponse;
exports.APIErrorCodes = {
    '-1': { name: 'InternalSystemError', retryable: true },
    '2': { name: 'AccessKeyError', retryable: false },
    '3': { name: 'AuthenticationFailedError', retryable: true },
    '4': { name: 'InputError', retryable: false },
    '6': { name: 'DuplicateUsernameError', retryable: false },
    '9': { name: 'RateLimitError', retryable: true },
    '16': { name: 'DoesNotExistError', retryable: false },
    '17': { name: 'NotAllowedError', retryable: false },
    '18': { name: 'EventNotSupportedError', retryable: false },
    '19': { name: 'ChannelFeatureNotSupportedError', retryable: false },
    '20': { name: 'MessageTooLongError', retryable: false },
    '21': { name: 'MultipleNestingLevelError', retryable: false },
    '22': { name: 'PayloadTooBigError', retryable: false },
    '23': { name: 'RequestTimeoutError', retryable: true },
    '24': { name: 'MaxHeaderSizeExceededError', retryable: false },
    '40': { name: 'AuthErrorTokenExpired', retryable: false },
    '41': { name: 'AuthErrorTokenNotValidYet', retryable: false },
    '42': { name: 'AuthErrorTokenUsedBeforeIssuedAt', retryable: false },
    '43': { name: 'AuthErrorTokenSignatureInvalid', retryable: false },
    '44': { name: 'CustomCommandEndpointMissingError', retryable: false },
    '45': { name: 'CustomCommandEndpointCallError', retryable: true },
    '46': { name: 'ConnectionIDNotFoundError', retryable: false },
    '60': { name: 'CoolDownError', retryable: true },
    '69': { name: 'ErrWrongRegion', retryable: false },
    '70': { name: 'ErrQueryChannelPermissions', retryable: false },
    '71': { name: 'ErrTooManyConnections', retryable: true },
    '99': { name: 'AppSuspendedError', retryable: false },
};
function isAPIError(error) {
    return error.code !== undefined;
}
function isErrorRetryable(error) {
    if (!error.code)
        return false;
    const err = exports.APIErrorCodes[`${error.code}`];
    if (!err)
        return false;
    return err.retryable;
}
function isConnectionIDError(error) {
    return error.code === 46; // ConnectionIDNotFoundError
}
function isWSFailure(err) {
    if (typeof err.isWSFailure === 'boolean') {
        return err.isWSFailure;
    }
    try {
        return JSON.parse(err.message).isWSFailure;
    }
    catch (_) {
        return false;
    }
}
function isErrorResponse(res) {
    return !res.status || res.status < 200 || 300 <= res.status;
}
